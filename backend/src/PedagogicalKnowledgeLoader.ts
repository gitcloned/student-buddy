
import { BOOK_FEATURES } from "./data/book_features";
import ConversationManager from "./ConversationManager";

interface BookFeature {
  id: number;
  subject: string;
  name: string;
  howToTeach: string;
}

interface Book {
  id: number;
  features: BookFeature[];
}

export async function loadPedagogicalKnowledgeForBookFeature(
  sessionId: string,
  bookFeature: string
): Promise<string> {
  const conversationManager = ConversationManager.getInstance();
  const session = conversationManager.getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  const books: Book[] = BOOK_FEATURES;

  // Find books that match the session's book IDs
  const sessionBooks = books.filter((book) =>
    session.bookIds.includes(book.id)
  );

  // Find the specific feature across all session books
  for (const book of sessionBooks) {
    const feature = book.features.find(
      (f) => f.name.toLowerCase() === bookFeature.toLowerCase()
    );
    if (feature) {
      return feature.howToTeach
    }
  }

  throw new Error(
    `Feature "${bookFeature}" not found in any of the session's books`
  );
}


export async function loadBookFeatures(
  sessionId: string
): Promise<{ feature: string; subject: string }[]> {
  const conversationManager = ConversationManager.getInstance();
  const session = conversationManager.getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  const books: Book[] = BOOK_FEATURES;

  // Find books that match the session's book IDs
  const sessionBooks = books.filter((book) =>
    session.bookIds.includes(book.id)
  );

  // Return all features for the session's books, flattened
return sessionBooks.flatMap((book) =>
  book.features.map((feature) => ({
    feature: feature.name,
    subject: feature.subject,
  }))
);

}
