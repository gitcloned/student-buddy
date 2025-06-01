import { ChatCompletionMessageParam } from "openai/resources/chat";
import Session from "./Session";

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

  public createSession(
    sessionId: string, 
    studentId: number,
    subjectId?: number, 
    featureId?: number
  ): void {
    this.sessions.set(sessionId, new Session({
      sessionId,
      studentId,
      subjectId,
      featureId
    }));
  }

  public getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  public appendMessage(sessionId: string, message: ChatCompletionMessageParam): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages?.push(message);
      this.sessions.set(sessionId, session);
    }
  }
}

export default ConversationManager;