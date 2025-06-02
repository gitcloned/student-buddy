import { Session } from "../Session";

/**
 * Builds the teaching style section of the prompt
 */
export function buildTeachingStyle(session: Session): string {
  return `Your teaching style:
----
${session.teacherPersona?.persona || 'Be a friendly and supportive teacher.'}`;
}
