import { TeacherPersona, BookFeature as BookFeatureType, Subject } from "./types";
import { Feature } from "./features/Feature";
import { Database } from "sqlite";
import { getScriptToWriteIn, loadTeacherPersona } from "./TeacherPersonaLoader";
import { loadBookFeatures } from "./PedagogicalKnowledgeLoader";
import { ChatCompletionMessageParam } from "openai/resources/chat";

export default class Session {
  _teacherPersona: TeacherPersona | undefined;
  _bookFeatures: BookFeatureType[] | undefined;
  sessionId: string;
  studentId: number;
  subjectId?: number;
  featureId?: number;
  grade?: string;
  bookIds?: number[];
  subjectStudying?: Subject;
  featureStudying?: Feature | null;
  _messages: ChatCompletionMessageParam[];

  constructor({
    sessionId,
    studentId,
    subjectId,
    featureId,
  }: {
    sessionId: string;
    studentId: number;
    subjectId?: number;
    featureId?: number;
  }) {
    this.sessionId = sessionId;
    this.studentId = studentId;
    this.subjectId = subjectId;
    this.featureId = featureId;
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
      
${this.featureStudying ? `You are currently teaching ${this.featureStudying.name}. Follow these instructions: \n${this.featureStudying.getWhatToTeach()}`
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
    const featureData = this._bookFeatures?.find(f => f.name === featureName);
    if (featureData) {
      // Create the appropriate Feature instance using the factory method
      this.featureStudying = Feature.createFeature(featureData);
      // When setting from a feature, we need to fetch the full subject details
      // We'll do this in the initialise method if featureId is provided
    } else {
      this.featureStudying = null;
    }
  }

  setSubjectStudying(subject: Subject) {
    this.subjectStudying = subject;
  }

  async initialise(db: Database): Promise<void> {
    // Fetch student's grade based on studentId
    const studentData = await db.get(
      'SELECT c.id, g.name as grade FROM children c JOIN grades g ON c.grade_id = g.id WHERE c.id = ?',
      this.studentId
    );

    if (!studentData) {
      throw new Error(`Student with ID ${this.studentId} not found`);
    }

    this.grade = studentData.grade;

    // Fetch books for the student's grade
    // Step 1: Get the grade_id for the child
    const gradeRow = await db.get(
      `SELECT grade_id FROM children WHERE id = ?`,
      this.studentId
    );
    const gradeId = gradeRow?.grade_id;

    // Step 2: Get all book_ids for subjects with that grade_id
    const bookIdsData = await db.all(
      `SELECT book_id FROM subjects WHERE grade_id = ? AND book_id IS NOT NULL`,
      gradeId
    );
    const bookIds = bookIdsData.map(row => row.book_id);

    // Step 3: Fetch all books with those IDs (if any)
    let booksData = [];
    if (bookIds.length > 0) {
      booksData = await db.all(
        `SELECT id FROM books WHERE id IN (${bookIds.map(() => '?').join(',')})`,
        ...bookIds
      );
    }

    this.bookIds = booksData.map(book => book.id);

    // If subjectId was provided, mark it as studying
    if (this.subjectId) {
      const subjectData = await db.get(
        'SELECT id, name, grade_id, book_id, default_teacher_id FROM subjects WHERE id = ?',
        this.subjectId
      );
      if (subjectData) {
        this.setSubjectStudying(subjectData);
      }
    }

    // Load teacher persona and book features
    this.teacherPersona = await loadTeacherPersona(this.sessionId, db);
    this.bookFeatures = await loadBookFeatures(this.sessionId, db);

    // If featureId was provided, mark it as studying
    if (this.featureId) {
      const featureData = await db.get(
        'SELECT * FROM book_features WHERE id = ?',
        this.featureId
      );

      if (featureData) {
        // Create the appropriate Feature instance using the factory method
        this.featureStudying = Feature.createFeature(featureData);
      }

      // Also set the subject for this feature if not already set
      if (!this.subjectStudying && featureData.subject) {
        const subjectData = await db.get(
          'SELECT id, name, grade_id, book_id, default_teacher_id FROM subjects WHERE name = ?',
          featureData.subject
        );
        if (subjectData) {
          this.setSubjectStudying(subjectData);
        }
      }
    }
  }
}