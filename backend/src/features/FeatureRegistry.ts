import { BookFeature as BookFeatureType } from "../types";
import { Feature } from "./Feature";

/**
 * Registry for feature classes to avoid circular dependencies
 */
export class FeatureRegistry {
  private static featureClasses: Record<string, new (feature: BookFeatureType) => Feature> = {};

  /**
   * Register a feature class with the registry
   */
  static registerFeatureClass(type: string, featureClass: new (feature: BookFeatureType) => Feature): void {
    this.featureClasses[type] = featureClass;
  }

  /**
   * Get a feature class from the registry
   */
  static getFeatureClass(type: string): new (feature: BookFeatureType) => Feature {
    const featureClass = this.featureClasses[type];
    if (!featureClass) {
      throw new Error(`Feature class for type '${type}' not registered`);
    }
    return featureClass;
  }
}
