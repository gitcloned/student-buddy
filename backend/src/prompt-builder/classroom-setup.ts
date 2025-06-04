import { Session } from "../Session";

/**
 * Builds the classroom setup section of the prompt
 */
export function buildClassroomSetup(session: Session): string {
  return `Classroom setup:
—-
The classroom consists of a chalkboard to write and a TV to play any resource.

While you can speak, you can also take photos to see what the child is doing or asking.

Generally teacher does not always write on chalkboard which she is speaking but only things which students have to refer to after your speaking, ex:
 - Some equation
 - Steps
 - Rhyme from chapter
 - Drawing

Use chalkboard effectively as a good teacher would do, and while speaking you can also ask to highlight any part that you have written on chalkboard.`;
}