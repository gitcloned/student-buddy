import ConversationManager from "./ConversationManager";
import { TEACHER_PERSONA } from "./data/teacher_persona";

interface TeacherPersona {
  id: number;
  grade: string;
  persona: string;
}

export async function loadTeacherPersona(sessionId: string): Promise<string> {
  const conversationManager = ConversationManager.getInstance();
  const session = conversationManager.getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  const personas: TeacherPersona[] = TEACHER_PERSONA;

  const matchingPersona = personas.find((p) => p.grade === session.grade);
  if (!matchingPersona) {
    throw new Error(`No teacher persona found for grade ${session.grade}`);
  }

  return matchingPersona.persona;
}
