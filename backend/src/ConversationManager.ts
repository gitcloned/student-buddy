import { ChatCompletionMessageParam } from "openai/resources/chat";

interface Session {
  sessionId: string;
  grade: string;
  bookIds: number[];
  systemPrompt?: string;
  featureMap?: string[];
  messages: ChatCompletionMessageParam[]; // Add message history
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
    this.sessions.set(sessionId, { 
      sessionId, 
      grade, 
      bookIds,
      messages: [] // Initialize empty message array
    });
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

  public setFeatureMap(sessionId: string, featureMap: string[]): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.featureMap = featureMap;
      this.sessions.set(sessionId, session);
    }
  }

  // New method to append messages
  public appendMessage(sessionId: string, message: ChatCompletionMessageParam): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push(message);
      this.sessions.set(sessionId, session);
    }
  }

  // New method to get message history
  public getMessages(sessionId: string): ChatCompletionMessageParam[] {
    const session = this.sessions.get(sessionId);
    return session ? session.messages : [];
  }
}

export default ConversationManager;