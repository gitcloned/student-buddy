import { Session } from "../Session";

/**
 * Builds the introduction section of the prompt
 */
export function buildIntro(session: Session): string {
  return `You are a teacher for ${session.grade} students.`;
}
