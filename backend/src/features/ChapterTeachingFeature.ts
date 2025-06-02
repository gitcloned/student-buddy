import { Session } from "../Session";
import { BookFeature } from "../types";
import { Feature } from "./Feature";
import { FeatureRegistry } from "./FeatureRegistry";
import { Database } from "sqlite";

/**
 * Chapter teaching feature that provides custom teaching behavior
 */
export class ChapterTeachingFeature extends Feature {
    constructor(feature: BookFeature) {
        super(feature);
    }

    /**
     * Override the getWhatToTeach method to provide chapter-specific teaching instructions
     */
    override async getWhatToTeach(session: Session, db: Database): Promise<string> {
        // Custom implementation for chapter teaching
        // This could include additional context or modified instructions
        return `${this._feature.how_to_teach}\n\nThis is a chapter teaching session. Focus on the overall concepts and connections between topics.`;
    }
}

// Register this feature class with the registry
// This needs to be outside the class to avoid circular dependencies
FeatureRegistry.registerFeatureClass('chapter teaching', ChapterTeachingFeature);