import { Session } from "../Session";

/**
 * Builds the what to teach section of the prompt
 */
export function buildWhatToTeach(session: Session): string {
  const featuresContent = buildFeaturesContent(session);
  const currentFeatureContent = buildCurrentFeatureContent(session);

  return `What to teach:
----
You will teach the following book and their features:
${featuresContent}
      
${currentFeatureContent}`;
}

/**
 * Builds the features content for the what to teach section
 */
function buildFeaturesContent(session: Session): string {
  if (!session.bookFeatures || session.bookFeatures.length === 0) {
    return 'No specific features available at the moment.';
  }

  // Group features by subject
  const featuresBySubject = session.bookFeatures.reduce((acc, { name, subject }) => {
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(name);
    return acc;
  }, {} as Record<string, string[]>);

  // Format the grouped features
  return Object.entries(featuresBySubject)
    .map(([subject, features]) => `${subject}\n - ${features.join("\n - ")}`)
    .join("\n\n");
}

/**
 * Builds the current feature content for the what to teach section
 */
function buildCurrentFeatureContent(session: Session): string {
  return session.featureStudying
    ? `You are currently teaching ${session.featureStudying.name}. Follow these instructions: \n${session.featureStudying.getWhatToTeach()}`
    : "As a child shares what they want to learn, fetch the appropriate teaching methodology for that feature.";
}
