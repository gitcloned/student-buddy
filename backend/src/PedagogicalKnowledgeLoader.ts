import ConversationManager from "./ConversationManager";
import { Database } from "sqlite";

interface BookFeature {
  feature: string;
  subject: string;
  how_to_teach: string;
}

export async function loadBookFeatures(
  sessionId: string,
  db: Database
): Promise<{ feature: string; subject: string }[]> {
  const conversationManager = ConversationManager.getInstance();
  const session = conversationManager.getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  const features = await db.all(
    `SELECT bf.name as feature, bf.subject
     FROM book_features bf
     JOIN books b ON b.id = bf.book_id
     WHERE b.id IN (${session.bookIds.map(() => '?').join(',')})`,
    session.bookIds
  );

  return features;
}

export async function loadPedagogicalKnowledgeForBookFeature(
  sessionId: string,
  bookFeature: string,
  db: Database
): Promise<string> {
  const conversationManager = ConversationManager.getInstance();
  const session = conversationManager.getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  const feature = await db.get(
    `SELECT how_to_teach 
     FROM book_features bf
     JOIN books b ON b.id = bf.book_id
     WHERE b.id IN (${session.bookIds.map(() => '?').join(',')})
     AND bf.name = ?`,
    [...session.bookIds, bookFeature]
  );

  if (!feature) {
    throw new Error(
      `Feature "${bookFeature}" not found in any of the session's books`
    );
  }

  return feature.how_to_teach;
}