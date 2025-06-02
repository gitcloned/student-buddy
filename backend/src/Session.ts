import { TeacherPersona, BookFeature as BookFeatureType, Subject } from "./types";
import { Feature } from "./features/Feature";
import { Database } from "sqlite";
import { loadTeacherPersona } from "./TeacherPersonaLoader";
import { loadBookFeatures } from "./PedagogicalKnowledgeLoader";
import { ChatCompletionMessageParam } from "openai/resources/chat";
import { PromptBuilder } from "./prompt-builder";

export class Session {
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

  async getSystemPrompt(): Promise<string> {
    const promptBuilder = PromptBuilder.getInstance();
    return await promptBuilder.buildSystemPrompt(this);
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