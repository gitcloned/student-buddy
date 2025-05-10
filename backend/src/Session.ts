import { TeacherPersona, BookFeature as BookFeatureType } from "./types";
import { Database } from "sqlite";
import { getScriptToWriteIn, loadTeacherPersona } from "./TeacherPersonaLoader";
import { loadBookFeatures } from "./PedagogicalKnowledgeLoader";
import { ChatCompletionMessageParam } from "openai/resources/chat";

export default class Session {
  _teacherPersona: TeacherPersona | undefined;
  _bookFeatures: BookFeatureType[] | undefined;
  sessionId: string;
  grade: string;
  bookIds: number[];
  featureStudying?: BookFeatureType | null;
  _messages: ChatCompletionMessageParam[];

  constructor({
    sessionId,
    grade,
    bookIds,
  }: {
    sessionId: string;
    grade: string;
    bookIds: number[]
  }) {
    this.sessionId = sessionId;
    this.grade = grade;
    this.bookIds = bookIds;
    this._messages = []
  }

  get teacherPersona(): TeacherPersona | undefined {
    return this._teacherPersona;
  }

  get bookFeatures(): BookFeatureType[] | undefined {
    return this._bookFeatures;
  }

  get messages(): ChatCompletionMessageParam[] {
    return this._messages;
  }

  get systemPrompt() {
    return `You are a teacher for ${this.grade} students.

Your teaching style:
----
${this.teacherPersona?.persona}


What to teach:
----
You will teach the following book and their features:
${Object.entries(
      this.bookFeatures?.reduce((acc, { name, subject }) => {
        if (!acc[subject]) acc[subject] = [];
        acc[subject].push(name);
        return acc;
      }, {} as Record<string, string[]>)
      ?? {} // <--- this ensures that if reduce returns undefined, we use an empty object
    )
        .map(([subject, features]) => `${subject}\n - ${features.join("\n - ")}`)
        .join("\n\n")}
      
${this.featureStudying?.how_to_teach ? `You are currently teaching ${this.featureStudying.name}. Follow these instructions: \n${this.featureStudying.how_to_teach}`
        : "As a child shares what they want to learn, fetch the appropriate teaching methodology for that feature."}


Classroom setup:
----
While you can speak, you can also take photo to see what the child is doing or asking. For that pass action as "take_photo"
The classroom setup contains a chalkboard to write on, which you can also use to explain or ask while teaching. 

Generally teacher does not always write on chalkboard which she is speaking but only things which students have to refer to after your speaking, ex:
 - Some equation
 - Steps
 - Rhyme from chapter
 - Drawing
 

Reply format
----
You should always reply back in YAML format only and nothing else. YAML reply can contain below attributes:

type: what type of reply this is, text, action
speak: text to speak
action: action to perform (take_photo)
write: what to write on chalkboard
draw: anything to draw as well

${getScriptToWriteIn(this.teacherPersona?.language ?? 'english')}

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
write: 
`
  }

  get featureMap(): string[] {
    return this._bookFeatures?.map(f => f.name) ?? [];
  }

  set teacherPersona(teacherPersona: TeacherPersona) {
    this._teacherPersona = teacherPersona;
  }

  set bookFeatures(bookFeatures: BookFeatureType[]) {
    this._bookFeatures = bookFeatures;
  }

  currentlyStudying(featureName: string) {
    this.featureStudying = this._bookFeatures?.find(f => f.name === featureName) ?? null;
  }

  async initialise(db: Database): Promise<void> {
    this.teacherPersona = await loadTeacherPersona(this.sessionId, db);
    this.bookFeatures = await loadBookFeatures(this.sessionId, db);
  }
}