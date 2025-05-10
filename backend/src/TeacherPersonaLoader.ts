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

  const persona = await db.get(
    `SELECT persona, language, tone, motivation, humor FROM teacher_personas WHERE grade = ?`,
    session.grade
  );

  if (!persona) {
    throw new Error(`No teacher persona found for grade ${session.grade}`);
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
