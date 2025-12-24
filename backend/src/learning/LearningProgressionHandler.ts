import { WebSocket } from 'ws';
import { LearningProgressionService } from './LearningProgressionService';
import { Database } from 'sqlite';

/**
 * Handles WebSocket messages related to learning progression
 */
export class LearningProgressionHandler {
  private learningProgressionService: LearningProgressionService;
  
  constructor(db: Database) {
    this.learningProgressionService = new LearningProgressionService(db);
  }
  
  /**
   * Process a WebSocket message related to learning progression
   * @param ws - WebSocket connection
   * @param data - Message data from client
   */
  async handleMessage(ws: WebSocket, data: any): Promise<void> {
    if (data.type === 'fetch-learning-progression') {
      const response = await this.learningProgressionService.handleLearningProgressionRequest(data);
      ws.send(JSON.stringify(response));
    }
  }
  
  /**
   * Registers message handlers with the WebSocket server
   * @param ws - WebSocket connection to register handlers for
   * @param messageHandler - Function to process incoming messages
   */
  static registerHandlers(ws: WebSocket, db: Database): void {
    const handler = new LearningProgressionHandler(db);
    
    // Store the original message handler if it exists
    const originalOnMessage = ws.onmessage;
    
    // Create a new message handler that checks for our specific message types
    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data.toString());
        
        // If it's a learning progression message, handle it
        if (data.type === 'fetch-learning-progression') {
          await handler.handleMessage(ws, data);
          return;
        }
        
        // Otherwise, pass to the original handler if it exists
        if (originalOnMessage) {
          originalOnMessage(event);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };
  }
}
