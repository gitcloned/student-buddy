import { Session } from "../Session";
import { BookFeature as BookFeatureType } from "../types";
import { Database } from "sqlite";
import { FeatureRegistry } from "./FeatureRegistry";

/**
 * Base Feature class that defines the interface for all feature types
 */
export abstract class Feature {
  protected _feature: BookFeatureType;

  constructor(feature: BookFeatureType) {
    this._feature = feature;
  }

  get id(): number {
    return this._feature.id;
  }

  get bookId(): number {
    return this._feature.book_id;
  }

  get subject(): string {
    return this._feature.subject;
  }

  get name(): string {
    return this._feature.name;
  }

  get howToTeach(): string {
    return this._feature.how_to_teach;
  }

  /**
   * Returns the teaching instructions for this feature
   * This method can be overridden by subclasses to provide custom teaching instructions
   */
  async getWhatToTeach(session: Session, db: Database): Promise<string> {
    return this._feature.how_to_teach;
  }

  /**
   * Factory method to create the appropriate Feature instance based on feature type
   */
  static createFeature(feature: BookFeatureType): Feature {
    // Check if this is a chapter teaching feature
    if (feature.name.toLowerCase().trim().includes('chapter teaching')) {
      // We'll use a dynamic approach to avoid circular dependencies
      // The actual ChapterTeachingFeature instance will be created in a separate file
      const ChapterFeatureClass = FeatureRegistry.getFeatureClass('chapter teaching');
      return new ChapterFeatureClass(feature);
    }
    
    // Default case
    return new DefaultFeature(feature);
  }
}

/**
 * Default implementation that provides the standard behavior
 */
export class DefaultFeature extends Feature {
  constructor(feature: BookFeatureType) {
    super(feature);
  }

  // Uses the default implementation from the base class
}
