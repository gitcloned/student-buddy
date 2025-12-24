import { Session } from "../Session";
import { BookFeature } from "../types";
import { Feature } from "./Feature";
import { FeatureRegistry } from "./FeatureRegistry";
import { Database } from "sqlite";
import { ChapterLearningService } from "../learning/ChapterLearningService";
import { LearningProgressionAnalyzer } from "../learning/LearningProgressionAnalyzer";
import { TeachingContentFormatter } from "../learning/TeachingContentFormatter";

/**
 * Chapter teaching feature that provides custom teaching behavior
 */
export class ChapterTeachingFeature extends Feature {
    constructor(feature: BookFeature) {
        super(feature);
    }

    /**
     * Override the getWhatToTeach method to provide chapter-specific teaching instructions
     * This implementation identifies the appropriate learning outcome to teach and 
     * generates a structured teaching prompt based on the student's learning progression
     */
    override async getWhatToTeach(session: Session, db: Database): Promise<string> {
        if (!session.studentId || !session.chapterId) {
            return `${this._feature.how_to_teach}\n\nThis is a chapter teaching session. Focus on the overall concepts and connections between topics.`;
        }

        try {
            // Create services for generating teaching content
            const learningService = new ChapterLearningService(db);
            const analyzer = new LearningProgressionAnalyzer(learningService);
            const formatter = new TeachingContentFormatter();

            // Get student and chapter details
            const studentDetails = await learningService.getStudentDetails(session.studentId);
            const chapterDetails = await learningService.getChapterDetails(session.chapterId);
            
            if (!studentDetails || !chapterDetails) {
                throw new Error("Could not find student or chapter details");
            }
            
            // Find the next learning outcome to teach (first one that's not fully taught)
            const nextOutcome = await analyzer.findNextLearningOutcomeToTeach(
                session.chapterId,
                session.studentId
            );
            
            if (!nextOutcome) {
                return `You are teaching "${chapterDetails.name}", but there are no learning outcomes available.`;
            }
            
            // Get assessment questions for the learning indicators
            const questions = await analyzer.getAssessmentQuestionsForIndicators(
                nextOutcome.indicators
            );
            
            // Format the teaching content
            const teachingContent = formatter.generateTeachingPrompt(
                chapterDetails.name, 
                studentDetails.name || 'the student', 
                nextOutcome, 
                questions
            );
            
            return teachingContent;
        } catch (error) {
            console.error('Error in ChapterTeachingFeature.getWhatToTeach:', error);
            return `${this._feature.how_to_teach}\n\nThis is a chapter teaching session. Focus on the overall concepts and connections between topics.`;
        }
    }
}

// Register this feature class with the registry
// This needs to be outside the class to avoid circular dependencies
FeatureRegistry.registerFeatureClass('chapter teaching', ChapterTeachingFeature);