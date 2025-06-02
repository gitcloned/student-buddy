import { BookFeature as BookFeatureType } from "../types";

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
  getWhatToTeach(): string {
    return this._feature.how_to_teach;
  }

  /**
   * Factory method to create the appropriate Feature instance based on feature type
   */
  static createFeature(feature: BookFeatureType): Feature {
    // Check if this is a chapter teaching feature
    if (feature.name.toLowerCase().includes('chapter')) {
      return new ChapterTeachingFeature(feature);
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

/**
 * Chapter teaching feature that provides custom teaching behavior
 */
export class ChapterTeachingFeature extends Feature {
  constructor(feature: BookFeatureType) {
    super(feature);
  }

  /**
   * Override the getWhatToTeach method to provide chapter-specific teaching instructions
   */
  override getWhatToTeach(): string {
    // Custom implementation for chapter teaching
    // This could include additional context or modified instructions
    return `${this._feature.how_to_teach}\n\nThis is a chapter teaching session. Focus on the overall concepts and connections between topics.`;
  }
}
