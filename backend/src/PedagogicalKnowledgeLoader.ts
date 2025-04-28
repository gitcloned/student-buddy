import ConversationManager from "./ConversationManager";
import { Database } from "sqlite";
import { BookFeature } from "./types";

export async function loadBookFeatures(
  sessionId: string,
  db: Database
): Promise<BookFeature[]> {
  const conversationManager = ConversationManager.getInstance();
  const session = conversationManager.getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  const features = await db.all(
    `SELECT bf.id, bf.book_id, bf.subject, bf.name, bf.how_to_teach
     FROM book_features bf
     JOIN books b ON b.id = bf.book_id
     WHERE b.id IN (${session.bookIds.map(() => '?').join(',')})`,
    session.bookIds
  );

  return features as BookFeature[];
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

  console.log(`got PK for feature: ${bookFeature}: ${feature.how_to_teach}`);
  return feature.how_to_teach;
}