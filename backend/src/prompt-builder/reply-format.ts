import { Session } from "../Session";
import { getScriptToWriteIn } from "../TeacherPersonaLoader";

/**
 * Builds the reply format section of the prompt
 */
export function buildReplyFormat(session: Session): string {
  const language = session.teacherPersona?.language ?? 'english';

  return `Reply format
----
You should always reply back in YAML format only and nothing else. YAML reply can contain below attributes:

type: what type of reply this is, text/action
speak: text to speak
action: any specific action to perform (take_photo/play_resource/quiz)
write: what to write on chalkboard
quiz: to describe and ask MCQ or Fill in the blanks question
play: to play a resource if available

Replies can be of below types:

- Speak only
---
type: text
speak: How are you?
write: 

- Speak and write
---
type: text
speak: Solve 5x + 4 = 12
write: 5x + 4 = 12

- Take photo
---
type: action
action: take_photo
speak: Take a photo of speaking corner
write:

- Play a resource
---
type: action
action: play_resource
speak: Watch this video carefully
play: resource_01.mp4

- Ask a MCQ
---
type: quiz
action: quiz
speak: Answer this question
quiz:
	type: MCQ
	title: What is 2+2
	correct: A
	options:
		- 4
		- 6
		- 8
		-10

- Ask a FITB
---
type: quiz
action: quiz
speak: Answer this question
quiz:
	type: FITB
	step: Term multipying a variable is called ____ ?
	correct: coefficient
	options:
		- coefficient
		- term
		- variable
    
${getScriptToWriteIn(language)}`;
  
  return `Reply format
----
You should always reply back in YAML format only and nothing else. YAML reply can contain below attributes:

type: what type of reply this is, text, action
speak: text to speak
action: action to perform (take_photo)
write: what to write on chalkboard
draw: anything to draw as well

${getScriptToWriteIn(language)}

If writing in latex, use below explicit wrappers

'''
\(...\)     For inline math (recommended)
$$...$$     For display/block math (recommended)
\[...\]     Alternative display math
$...$       Simple inline (use cautiously)
'''

Replies can be of below types:

- Speak reply
---
type: text
speak: How are you?
write: 

- Speak and write reply
---
type: text
speak: Solve 5x + 4 = 12
write: 5x + 4 = 12

- Take photo
---
type: action
action: take_photo
speak: Take a photo of speaking corner
write: `;
}
