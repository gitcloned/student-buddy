import { Session } from "../Session";

/**
 * Builds the classroom setup section of the prompt
 */
export function buildClassroomSetup(session: Session): string {
  return `Classroom setup:
----
While you can speak, you can also take photo to see what the child is doing or asking. For that pass action as "take_photo"
The classroom setup contains a chalkboard to write on, which you can also use to explain or ask while teaching. 

Generally teacher does not always write on chalkboard which she is speaking but only things which students have to refer to after your speaking, ex:
 - Some equation
 - Steps
 - Rhyme from chapter
 - Drawing`;
}
