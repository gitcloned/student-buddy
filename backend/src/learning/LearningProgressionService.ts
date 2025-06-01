import { Database } from "sqlite";
import { LearningProgression } from "../types";

/**
 * Service for handling learning progression data and operations
 */
export class LearningProgressionService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Fetches a child's learning progression for a specific chapter
   * @param childId - The ID of the child
   * @param chapterId - The ID of the chapter
   * @returns A promise resolving to the child's learning progression
   */
  async fetchLearningProgression(childId: string | number, chapterId: string | number): Promise<LearningProgression> {
    // Convert to numbers if passed as strings
    const childIdNum = typeof childId === 'string' ? parseInt(childId) : childId;
    const chapterIdNum = typeof chapterId === 'string' ? parseInt(chapterId) : chapterId;
    
    // 1. Verify the child exists
    const child = await this.db.get("SELECT * FROM children WHERE id = ?", childIdNum);
    if (!child) {
      throw new Error("Child not found");
    }

    // 2. Verify the chapter exists and get its name
    const chapter = await this.db.get(
      "SELECT chapters.*, subjects.name as subject_name FROM chapters " +
      "JOIN subjects ON chapters.subject_id = subjects.id " +
      "WHERE chapters.id = ?", 
      chapterIdNum
    );
    
    if (!chapter) {
      throw new Error("Chapter not found");
    }

    // 3. Get all topics for this chapter
    const topics = await this.db.all(
      "SELECT * FROM topics WHERE chapter_id = ? ORDER BY id", 
      chapterIdNum
    );
    
    // 4. For each topic, get all learning indicators and the child's learning level
    const topicsWithLearningIndicators = await Promise.all(
      topics.map(async (topic) => {
        // Get learning indicators for this topic
        const learningIndicators = await this.db.all(
          "SELECT * FROM learning_indicators WHERE topic_id = ?", 
          topic.id
        );
        
        // For each learning indicator, get the child's learning level
        const learningIndicatorsWithLevels = await Promise.all(
          learningIndicators.map(async (indicator) => {
            const level = await this.db.get(
              "SELECT * FROM learning_levels WHERE child_id = ? AND learning_indicator_id = ?", 
              [childIdNum, indicator.id]
            );
            
            return {
              id: indicator.id,
              title: indicator.title,
              commonMisconception: indicator.common_misconception,
              level: level ? level.level : null,
              state: level ? level.state : null,
              lastEvaluatedOn: level ? level.last_evaluated_on : null,
              doNotUnderstand: level ? level.do_not_understand : null,
              whatNext: level ? level.what_next : null
            };
          })
        );
        
        return {
          topicId: topic.id,
          topicName: topic.name,
          learningIndicators: learningIndicatorsWithLevels
        };
      })
    );
    
    // 5. Return the complete learning progression
    return {
      chapterId: chapterIdNum,
      chapterName: chapter.name,
      subjectName: chapter.subject_name,
      childId: childIdNum,
      childName: child.name,
      topics: topicsWithLearningIndicators
    };
  }

  /**
   * Handler for WebSocket messages requesting learning progression data
   * @param data - The request data containing childId and chapterId
   * @returns A promise resolving to the learning progression or error information
   */
  async handleLearningProgressionRequest(data: any): Promise<{ type: string; data?: LearningProgression; error?: string }> {
    try {
      const { childId, chapterId } = data;
      
      if (!childId || !chapterId) {
        throw new Error("Child ID and Chapter ID are required");
      }
      
      const progression = await this.fetchLearningProgression(childId, chapterId);
      
      return {
        type: "learning-progression",
        data: progression
      };
    } catch (error) {
      console.error("Error fetching learning progression:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        type: "error",
        error: `Failed to fetch learning progression: ${errorMessage}`
      };
    }
  }
}
