import { ChapterLearningService } from "./ChapterLearningService";

/**
 * Interface representing a Learning Outcome with its indicators and state
 */
export interface LearningOutcomeWithProgress {
  id: number;
  name: string;
  indicators: LearningIndicatorWithState[];
  isFullyTaught: boolean;
}

/**
 * Interface representing a Learning Indicator with its state
 */
export interface LearningIndicatorWithState {
  id: number;
  title: string;
  commonMisconception: string | null;
  level: string | null;
  state: string | null;
}

/**
 * Interface for assessment questions
 */
export interface AssessmentQuestion {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
}

/**
 * Analyzes learning progression data to identify which topics and indicators to focus on
 */
export class LearningProgressionAnalyzer {
  private learningService: ChapterLearningService;

  constructor(learningService: ChapterLearningService) {
    this.learningService = learningService;
  }

  /**
   * Gets all learning outcomes (topics) for a chapter with their progress
   * @param chapterId - The chapter ID
   * @param childId - The child's ID
   */
  async getLearningOutcomesWithProgress(
    chapterId: number,
    childId: number
  ): Promise<LearningOutcomeWithProgress[]> {
    // Get all learning outcomes for this chapter
    const outcomes = await this.learningService.getLearningOutcomes(chapterId);
    
    // For each outcome, get its indicators and the child's progress
    const outcomesWithProgress = await Promise.all(
      outcomes.map(async outcome => {
        const indicators = await this.learningService.getLearningIndicators(outcome.id);
        
        if (indicators.length === 0) {
          return {
            id: outcome.id,
            name: outcome.name,
            indicators: [],
            isFullyTaught: true
          };
        }
        
        // Get learning levels for all indicators
        const indicatorIds = indicators.map(i => i.id);
        const levelsMap = await this.learningService.getLearningLevels(childId, indicatorIds);
        
        // Combine indicators with their levels
        const indicatorsWithState = indicators.map(indicator => {
          const levelInfo = levelsMap.get(indicator.id) || { level: null, state: null };
          
          return {
            id: indicator.id,
            title: indicator.title,
            commonMisconception: indicator.commonMisconception,
            level: levelInfo.level,
            state: levelInfo.state
          };
        });
        
        // Check if all indicators are in 'taught' state
        const isFullyTaught = indicatorsWithState.every(
          indicator => indicator.state === 'taught'
        );
        
        return {
          id: outcome.id,
          name: outcome.name,
          indicators: indicatorsWithState,
          isFullyTaught
        };
      })
    );
    
    return outcomesWithProgress;
  }
  
  /**
   * Identifies the next learning outcome to teach
   * Prioritizes outcomes that are not fully taught
   */
  async findNextLearningOutcomeToTeach(
    chapterId: number,
    childId: number
  ): Promise<LearningOutcomeWithProgress | null> {
    const outcomes = await this.getLearningOutcomesWithProgress(chapterId, childId);
    
    if (outcomes.length === 0) {
      return null;
    }
    
    // First, try to find an outcome that is not fully taught
    const nextOutcome = outcomes.find(outcome => !outcome.isFullyTaught);
    
    // If all outcomes are taught, return the first one
    return nextOutcome || outcomes[0];
  }
  
  /**
   * Gets assessment questions for learning indicators
   */
  async getAssessmentQuestionsForIndicators(
    indicators: LearningIndicatorWithState[]
  ): Promise<Map<number, AssessmentQuestion[]>> {
    // Get IDs of indicators that need assessment
    const indicatorsToAssess = indicators.filter(
      i => i.state === 'assess' || !i.state
    );
    
    if (indicatorsToAssess.length === 0) {
      return new Map();
    }
    
    const indicatorIds = indicatorsToAssess.map(i => i.id);
    return await this.learningService.getAssessmentQuestions(indicatorIds);
  }
  
  /**
   * Groups learning indicators by their common misconceptions
   * This helps organize assessment questions efficiently
   */
  groupIndicatorsByMisconception(
    indicators: LearningIndicatorWithState[]
  ): Map<string, LearningIndicatorWithState[]> {
    const groups = new Map<string, LearningIndicatorWithState[]>();
    
    for (const indicator of indicators) {
      const misconception = indicator.commonMisconception || 'General';
      
      if (!groups.has(misconception)) {
        groups.set(misconception, []);
      }
      
      groups.get(misconception)!.push(indicator);
    }
    
    return groups;
  }
}
