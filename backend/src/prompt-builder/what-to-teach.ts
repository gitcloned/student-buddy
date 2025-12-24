import { Session } from "../Session";
import { Database } from "sqlite";

/**
 * Builds the what to teach section of the prompt
 */
export async function buildWhatToTeach(session: Session, db: Database): Promise<string> {
  const featuresContent = buildFeaturesContent(session);
  const currentFeatureContent = await buildCurrentFeatureContent(session, db);

  return `What to teach:
----
You can teach the following book and their features:
${featuresContent}

As a child shares what they want to learn, fetch the appropriate teaching methodology for that feature.
      
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
async function buildCurrentFeatureContent(session: Session, db: Database): Promise<string> {
  return session.featureStudying
    ? `From above features you are currently teaching: "${session.featureStudying.name}".

${await session.featureStudying.getWhatToTeach(session, db)}`
    : "";
}
