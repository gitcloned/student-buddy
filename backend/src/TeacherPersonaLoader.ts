import ConversationManager from "./ConversationManager";
import { Database } from "sqlite";
import { TeacherPersona } from "./types";
import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_API_URL
});

function getPromptName(language: string, tone: string, motivation: string): string | null {

  if (language.toLowerCase().trim() == 'english') {
    if (tone.toLowerCase().trim() == 'candid') {
      return `english-candid-supportive`;
    } else {
      return `english-formal-disciplinary`;
    }
  } else if (language.toLowerCase().trim() == 'hinglish') {
    if (tone.toLowerCase().trim() == 'candid') {
      return `hinglish-candid-supportive`;
    } else {
      return `hinglish-formal-disciplinary`;
    }
  }

  return null;
}

async function fetchPromptFromLangfuse(promptName: string): Promise<string | null> {

  const prompt = await langfuse.getPrompt(promptName);
  if (!prompt || !prompt.prompt) {
    return null;
  }
  return prompt.prompt;
}

export async function loadTeacherPersona(sessionId: string, db: Database): Promise<TeacherPersona> {
  const conversationManager = ConversationManager.getInstance();
  const session = conversationManager.getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  let persona: TeacherPersona | undefined;

  // If a subject is being studied and it has a default teacher, use that teacher's persona
  if (session.subjectStudying && session.subjectStudying.default_teacher_id) {
    // Get the teacher based on the default_teacher_id from the subject
    const teacher = await db.get(
      `SELECT t.id, t.name, t.persona_id, t.teaching_style 
       FROM teachers t 
       WHERE t.id = ?`,
      session.subjectStudying.default_teacher_id
    );

    if (teacher && teacher.persona_id) {
      // Get the teacher persona based on the persona_id
      persona = await db.get(
        `SELECT id, persona, language, tone, motivation, humor 
         FROM teacher_personas 
         WHERE id = ?`,
        teacher.persona_id
      );
      
      console.log(`Loaded teacher persona for subject ${session.subjectStudying.name} using default teacher ${teacher.name}`);
    }
  }

  // If no persona was found and session.subjectStudying is set, try to get persona via subject's default teacher
  if (!persona && session.subjectStudying) {
    // 1. Get the subject row to ensure up-to-date info
    const subject = await db.get(
      `SELECT * FROM subjects WHERE id = ?`,
      session.subjectStudying.id
    );
    if (subject && subject.default_teacher_id) {
      // 2. Get the teacher
      const teacher = await db.get(
        `SELECT * FROM teachers WHERE id = ?`,
        subject.default_teacher_id
      );
      if (teacher && teacher.persona_id) {
        // 3. Get the persona
        persona = await db.get(
          `SELECT id, persona, language, tone, motivation, humor 
           FROM teacher_personas 
           WHERE id = ?`,
          teacher.persona_id
        );
        if (persona) {
          console.log(`Loaded teacher persona for subject ${subject.name} using default teacher ${teacher.name}`);
        }
      }
    }
  }

  // If still no persona, fall back to grade-based persona
  if (!persona && session.grade) {
    persona = await db.get(
      `SELECT id, grade_id, persona, language, tone, motivation, humor 
       FROM teacher_personas 
       WHERE grade_id = (SELECT id FROM grades WHERE name = ?)`,
      session.grade
    );
    if (persona) {
      console.log(`Loaded default teacher persona for grade ${session.grade}`);
    } else {
      throw new Error(`No teacher persona found for grade ${session.grade}`);
    }
  }

  // At this point, persona should be defined since we either found it via subject or grade
  // or threw an error if neither was found
  if (!persona) {
    throw new Error('Failed to load a teacher persona');
  }
  
  // Decide prompt name
  const promptName = getPromptName(persona.language, persona.tone, persona.motivation);

  if (promptName) {
    const prompt = await fetchPromptFromLangfuse(promptName);
    if (prompt) {
      persona.persona = prompt;
    } else {
      console.warn(`Prompt not found in Langfuse for ${promptName}, using DB persona.`);
    }
  }

  return persona;
}

export function getScriptToWriteIn(language: string): string {

  if (language.toLowerCase().trim() == 'hinglish'
    && process.env.GENERATE_AUDIO_USING === 'sarvam') {
    return `Return what to 'speak' in Hinglish in Devanagari script only`;
  }

  return '';
}
