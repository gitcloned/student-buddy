import { Database } from "sqlite";

/**
 * Service for fetching and analyzing chapter learning data
 */
export class ChapterLearningService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Fetches all learning outcomes (topics) for a specific chapter
   * @param chapterId - The chapter ID
   * @returns Array of learning outcomes with their IDs and names
   */
  async getLearningOutcomes(chapterId: number): Promise<Array<{ id: number; name: string }>> {
    const topics = await this.db.all(
      "SELECT id, name FROM topics WHERE chapter_id = ? ORDER BY id",
      chapterId
    );

    return topics;
  }

  /**
   * Gets learning indicators for a specific learning outcome (topic)
   * @param topicId - The topic ID
   * @returns Array of learning indicators
   */
  async getLearningIndicators(topicId: number): Promise<Array<{
    id: number;
    title: string;
    commonMisconception: string | null;
  }>> {
    const indicators = await this.db.all(
      "SELECT id, title, common_misconception FROM learning_indicators WHERE topic_id = ? ORDER BY id",
      topicId
    );

    return indicators.map(indicator => ({
      id: indicator.id,
      title: indicator.title,
      commonMisconception: indicator.common_misconception
    }));
  }

  /**
   * Gets learning level information for a child's progress on specific learning indicators
   * @param childId - The child's ID
   * @param learningIndicatorIds - Array of learning indicator IDs
   * @returns Map of learning indicator ID to learning level info
   */
  async getLearningLevels(childId: number, learningIndicatorIds: number[]): Promise<Map<number, {
    level: string | null;
    state: string | null;
  }>> {
    if (learningIndicatorIds.length === 0) {
      return new Map();
    }

    const placeholders = learningIndicatorIds.map(() => '?').join(',');
    const levels = await this.db.all(
      `SELECT learning_indicator_id, level, state FROM learning_levels 
       WHERE child_id = ? AND learning_indicator_id IN (${placeholders})`,
      [childId, ...learningIndicatorIds]
    );

    const result = new Map();
    for (const level of levels) {
      result.set(level.learning_indicator_id, {
        level: level.level,
        state: level.state
      });
    }

    return result;
  }

  /**
   * Finds questions for assessing learning indicators
   * @param learningIndicatorIds - Array of learning indicator IDs
   * @returns Map of learning indicator ID to assessment questions
   */
  async getAssessmentQuestions(learningIndicatorIds: number[]): Promise<Map<number, Array<{
    id: number;
    title: string;
    description: string | null;
    url: string | null;
  }>>> {
    if (learningIndicatorIds.length === 0) {
      return new Map();
    }

    const placeholders = learningIndicatorIds.map(() => '?').join(',');
    
    // Find all question resources linked to these learning indicators
    const questionResources = await this.db.all(
      `SELECT r.id, r.title, r.url, r.description, lir.learning_indicator_id 
       FROM resources r
       JOIN learning_indicator_resources lir ON r.id = lir.resource_id
       WHERE lir.learning_indicator_id IN (${placeholders})
       AND r.type = 'Question'`,
      [...learningIndicatorIds]
    );

    const result = new Map();
    for (const resource of questionResources) {
      if (!result.has(resource.learning_indicator_id)) {
        result.set(resource.learning_indicator_id, []);
      }
      
      result.get(resource.learning_indicator_id).push({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        url: resource.url
      });
    }
    
    return result;
  }

  /**
   * Get details about a chapter
   * @param chapterId - ID of the chapter
   * @returns Chapter details including name and subject name
   */
  async getChapterDetails(chapterId: number): Promise<{ name: string; subjectName: string }> {
    try {
      const chapter = await this.db.get(
        `SELECT c.name, s.name as subject_name 
         FROM chapters c 
         JOIN subjects s ON c.subject_id = s.id 
         WHERE c.id = ?`,
        chapterId
      );
      
      if (!chapter) {
        throw new Error(`Chapter with ID ${chapterId} not found`);
      }
      
      return {
        name: chapter.name,
        subjectName: chapter.subject_name
      };
    } catch (error) {
      console.error(`Error fetching chapter details:`, error);
      return {
        name: `Chapter ${chapterId}`,
        subjectName: 'Unknown Subject'
      };
    }
  }

  /**
   * Get details about a student
   * @param studentId - ID of the student
   * @returns Student details including name
   */
  async getStudentDetails(studentId: number): Promise<{ name: string }> {
    try {
      const student = await this.db.get(
        `SELECT name FROM children WHERE id = ?`,
        studentId
      );
      
      if (!student) {
        throw new Error(`Student with ID ${studentId} not found`);
      }
      
      return {
        name: student.name
      };
    } catch (error) {
      console.error(`Error fetching student details:`, error);
      return {
        name: `Student ${studentId}`
      };
    }
  }
}