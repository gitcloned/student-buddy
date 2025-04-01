interface Session {
  sessionId: string;
  grade: string;
  bookIds: number[];
  systemPrompt?: string;
}

class ConversationManager {
  private static instance: ConversationManager;
  private sessions: Map<string, Session>;

  private constructor() {
    this.sessions = new Map();
  }

  public static getInstance(): ConversationManager {
    if (!ConversationManager.instance) {
      ConversationManager.instance = new ConversationManager();
    }
    return ConversationManager.instance;
  }

  public createSession(sessionId: string, grade: string, bookIds: number[]): void {
    this.sessions.set(sessionId, { sessionId, grade, bookIds });
  }

  public getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  public setSystemPrompt(sessionId: string, systemPrompt: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.systemPrompt = systemPrompt;
      this.sessions.set(sessionId, session);
    }
  }
}

export default ConversationManager;
