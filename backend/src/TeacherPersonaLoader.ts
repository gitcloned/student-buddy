import ConversationManager from "./ConversationManager";
import { Database } from "sqlite";
import { TeacherPersona } from "./types";

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

  return persona;
}