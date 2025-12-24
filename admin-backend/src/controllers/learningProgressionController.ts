import { Request, Response } from "express";
import { Database } from "sqlite";

/**
 * Controller for handling learning progression-related endpoints
 */
export class LearningProgressionController {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Get a child's learning progression for a specific chapter
   */
  async getLearningProgression(req: Request, res: Response): Promise<void> {
    const { childId, chapterId } = req.params;

    try {
      // 1. Verify the child exists
      const child = await this.db.get("SELECT * FROM children WHERE id = ?", childId);
      if (!child) {
        res.status(404).json({ error: "Child not found" });
        return;
      }

      // 2. Verify the chapter exists and get its name
      const chapter = await this.db.get(
        "SELECT chapters.*, subjects.name as subject_name FROM chapters " +
        "JOIN subjects ON chapters.subject_id = subjects.id " +
        "WHERE chapters.id = ?", 
        chapterId
      );
      
      if (!chapter) {
        res.status(404).json({ error: "Chapter not found" });
        return;
      }

      // 3. Get all topics for this chapter
      const topics = await this.db.all(
        "SELECT * FROM topics WHERE chapter_id = ? ORDER BY id", 
        chapterId
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
                [childId, indicator.id]
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
      res.json({
        chapterId: parseInt(chapterId as string),
        chapterName: chapter.name,
        subjectName: chapter.subject_name,
        childId: parseInt(childId as string),
        childName: child.name,
        topics: topicsWithLearningIndicators
      });
      
    } catch (error) {
      console.error("Error fetching learning progression:", error);
      res.status(500).json({ error: "Failed to fetch learning progression" });
    }
  }
}
