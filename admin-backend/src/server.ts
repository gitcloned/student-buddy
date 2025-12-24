import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";
import dotenv from "dotenv";
import { LearningProgressionController } from "./controllers/learningProgressionController";

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database setup
let db: Database;

async function initializeDatabase() {
  db = await open({
    filename: process.env.DATABASE_FILEPATH || "./admin_database.sqlite",
    driver: sqlite3.Database,
  });
  
  // Initialize the learning progression controller after database is ready
  learningProgressionController = new LearningProgressionController(db);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teacher_personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade_id INTEGER,
      persona TEXT NOT NULL,
      language TEXT NOT NULL CHECK (language IN ('hinglish', 'english', 'hindi')),
      tone TEXT NOT NULL CHECK (tone IN ('candid', 'formal')),
      motivation TEXT NOT NULL CHECK (motivation IN ('supportive', 'disciplinary')),
      humor TEXT NOT NULL CHECK (humor IN ('light', 'none', 'medium')),
      FOREIGN KEY (grade_id) REFERENCES grades(id)
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      persona_id INTEGER,
      teaching_style TEXT NOT NULL,
      FOREIGN KEY (persona_id) REFERENCES teacher_personas(id)
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      grade_id INTEGER,
      book_id INTEGER,
      default_teacher_id INTEGER,
      FOREIGN KEY (grade_id) REFERENCES grades(id),
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (default_teacher_id) REFERENCES teachers(id)
    );

    CREATE TABLE IF NOT EXISTS children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      grade_id INTEGER,
      FOREIGN KEY (grade_id) REFERENCES grades(id)
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject_id INTEGER,
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      chapter_id INTEGER,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id)
    );

    CREATE TABLE IF NOT EXISTS topic_prerequisites (
      topic_id INTEGER,
      prerequisite_topic_id INTEGER,
      FOREIGN KEY (topic_id) REFERENCES topics(id),
      FOREIGN KEY (prerequisite_topic_id) REFERENCES topics(id),
      PRIMARY KEY (topic_id, prerequisite_topic_id)
    );

    CREATE TABLE IF NOT EXISTS topic_chapter_mapping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER,
      chapter_id INTEGER,
      FOREIGN KEY (topic_id) REFERENCES topics(id),
      FOREIGN KEY (chapter_id) REFERENCES chapters(id),
      UNIQUE (topic_id, chapter_id)
    );

    CREATE TABLE IF NOT EXISTS lesson_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      topic_id INTEGER,
      teacher_id INTEGER,
      learning_level_id INTEGER CHECK (learning_level_id BETWEEN 1 AND 5),
      duration_minutes INTEGER,
      objectives TEXT NOT NULL,
      FOREIGN KEY (topic_id) REFERENCES topics(id),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    );

    CREATE TABLE IF NOT EXISTS lesson_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_plan_id INTEGER,
      type TEXT CHECK (type IN ('Introduction', 'I Do', 'We Do', 'You Do', 'Assessment', 'Homework')),
      teaching_pedagogy TEXT NOT NULL,
      duration_minutes INTEGER,
      order_index INTEGER,
      FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id)
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT CHECK (type IN ('Concept Video', 'Question', 'Quiz', 'Practice Test')),
      url TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS section_resources (
      section_id INTEGER,
      resource_id INTEGER,
      FOREIGN KEY (section_id) REFERENCES lesson_sections(id),
      FOREIGN KEY (resource_id) REFERENCES resources(id),
      PRIMARY KEY (section_id, resource_id)
    );

    CREATE TABLE IF NOT EXISTS learning_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER,
      learning_indicator_id INTEGER,
      level TEXT CHECK (level IN ('Weak', 'Average', 'Strong')),
      state TEXT CHECK (state IN ('assess', 'teach', 'taught', NULL)),
      do_not_understand TEXT,
      what_next TEXT,
      last_evaluated_on TEXT,
      FOREIGN KEY (child_id) REFERENCES children(id),
      FOREIGN KEY (learning_indicator_id) REFERENCES learning_indicators(id)
    );

    CREATE TABLE IF NOT EXISTS learning_indicators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      topic_id INTEGER,
      topic_chapter_mapping_id INTEGER,
      common_misconception TEXT,
      FOREIGN KEY (topic_id) REFERENCES topics(id),
      FOREIGN KEY (topic_chapter_mapping_id) REFERENCES topic_chapter_mapping(id)
    );

    CREATE TABLE IF NOT EXISTS learning_indicator_resources (
      learning_indicator_id INTEGER,
      resource_id INTEGER,
      FOREIGN KEY (learning_indicator_id) REFERENCES learning_indicators(id),
      FOREIGN KEY (resource_id) REFERENCES resources(id),
      PRIMARY KEY (learning_indicator_id, resource_id)
    );

    CREATE TABLE IF NOT EXISTS child_subjects (
      child_id INTEGER,
      subject_id INTEGER,
      FOREIGN KEY (child_id) REFERENCES children(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      PRIMARY KEY (child_id, subject_id)
    );

    CREATE TABLE IF NOT EXISTS teacher_subjects (
      teacher_id INTEGER,
      subject_id INTEGER,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      PRIMARY KEY (teacher_id, subject_id)
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT
    );

    CREATE TABLE IF NOT EXISTS book_features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER,
      subject TEXT NOT NULL,
      name TEXT NOT NULL,
      how_to_teach TEXT NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id)
    );
  `);
}

// Migration: Add new columns to existing tables if they don't exist
async function runMigrations() {
  try {
    // Check if topic_chapter_mapping has id column, if not recreate the table
    const tcmInfo = await db.all("PRAGMA table_info(topic_chapter_mapping)");
    const hasIdColumn = tcmInfo.some((col: any) => col.name === 'id');
    
    if (!hasIdColumn && tcmInfo.length > 0) {
      console.log("Migrating topic_chapter_mapping table to add id column...");
      // Create new table with id column
      await db.exec(`
        CREATE TABLE IF NOT EXISTS topic_chapter_mapping_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          topic_id INTEGER,
          chapter_id INTEGER,
          FOREIGN KEY (topic_id) REFERENCES topics(id),
          FOREIGN KEY (chapter_id) REFERENCES chapters(id),
          UNIQUE (topic_id, chapter_id)
        );
        INSERT INTO topic_chapter_mapping_new (topic_id, chapter_id) 
        SELECT topic_id, chapter_id FROM topic_chapter_mapping;
        DROP TABLE topic_chapter_mapping;
        ALTER TABLE topic_chapter_mapping_new RENAME TO topic_chapter_mapping;
      `);
      console.log("topic_chapter_mapping migration complete.");
    }

    // Check if learning_indicators has topic_chapter_mapping_id column
    const liInfo = await db.all("PRAGMA table_info(learning_indicators)");
    const hasMappingIdColumn = liInfo.some((col: any) => col.name === 'topic_chapter_mapping_id');
    
    if (!hasMappingIdColumn && liInfo.length > 0) {
      console.log("Adding topic_chapter_mapping_id column to learning_indicators...");
      await db.exec(`
        ALTER TABLE learning_indicators ADD COLUMN topic_chapter_mapping_id INTEGER REFERENCES topic_chapter_mapping(id);
      `);
      console.log("learning_indicators migration complete.");
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
}

// Initialize database first, then run migrations
initializeDatabase()
  .then(() => runMigrations())
  .catch(console.error);

// GET all teacher personas
app.get("/api/personas", async (req: Request, res: Response) => {
  try {
    const personas = await db.all("SELECT * FROM teacher_personas");
    res.json(personas);
  } catch (error) {
    console.error("Error fetching personas:", error);
    res.status(500).json({ error: "Failed to fetch personas" });
  }
});

// GET a specific teacher persona
app.get("/api/personas/:id", async (req: Request, res: Response) => {
  try {
    const persona = await db.get(
      "SELECT * FROM teacher_personas WHERE id = ?",
      req.params.id
    );
    if (!persona) {
      res.status(404).json({ error: "Persona not found" });
      return;
    }
    res.json(persona);
  } catch (error) {
    console.error("Error fetching persona:", error);
    res.status(500).json({ error: "Failed to fetch persona" });
  }
});

// POST create a new teacher persona
app.post("/api/personas", async (req: Request, res: Response) => {
  const { grade_id, persona, language, tone, motivation, humor } = req.body;

  if (!grade_id || !persona || !language || !tone || !motivation || !humor) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    // Verify that the grade_id exists
    const gradeExists = await db.get("SELECT id FROM grades WHERE id = ?", grade_id);
    if (!gradeExists) {
      res.status(400).json({ error: "Invalid grade_id" });
      return;
    }

    const result = await db.run(
      "INSERT INTO teacher_personas (grade_id, persona, language, tone, motivation, humor) VALUES (?, ?, ?, ?, ?, ?)",
      [grade_id, persona, language, tone, motivation, humor]
    );
    const id = result.lastID;
    const newPersona = await db.get(
      "SELECT * FROM teacher_personas WHERE id = ?",
      id
    );
    res.status(201).json(newPersona);
  } catch (error) {
    console.error("Error creating persona:", error);
    res.status(500).json({ error: "Failed to create persona" });
  }
});

// PUT update an existing teacher persona
app.put("/api/personas/:id", async (req: Request, res: Response) => {
  const { grade_id, persona, language, tone, motivation, humor } = req.body;

  if (!grade_id || !persona || !language || !tone || !motivation || !humor) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    // Verify that the grade_id exists
    const gradeExists = await db.get("SELECT id FROM grades WHERE id = ?", grade_id);
    if (!gradeExists) {
      res.status(400).json({ error: "Invalid grade_id" });
      return;
    }

    await db.run(
      "UPDATE teacher_personas SET grade_id = ?, persona = ?, language = ?, tone = ?, motivation = ?, humor = ? WHERE id = ?",
      [grade_id, persona, language, tone, motivation, humor, req.params.id]
    );
    const updatedPersona = await db.get("SELECT * FROM teacher_personas WHERE id = ?", req.params.id);
    if (!updatedPersona) {
      res.status(404).json({ error: "Persona not found" });
      return;
    }
    res.json(updatedPersona);
  } catch (error) {
    console.error("Error updating persona:", error);
    res.status(500).json({ error: "Failed to update persona" });
  }
});

// DELETE a teacher persona
app.delete("/api/personas/:id", async (req: Request, res: Response) => {
  try {
    const result = await db.run(
      "DELETE FROM teacher_personas WHERE id = ?",
      req.params.id
    );

    if (result.changes === 0) {
      res.status(404).json({ error: "Persona not found" });
      return;
    }

    res.status(204).end();
  } catch (error) {
    console.error("Error deleting persona:", error);
    res.status(500).json({ error: "Failed to delete persona" });
  }
});

// GET all books with features
app.get("/api/books", async (req: Request, res: Response) => {
  try {
    const books = await db.all("SELECT * FROM books");
    const features = await db.all("SELECT * FROM book_features");

    const booksWithFeatures = books.map((book) => ({
      ...book,
      features: features.filter((f) => f.book_id === book.id),
    }));

    res.json(booksWithFeatures);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// GET a specific book with features
app.get("/api/books/:id", async (req: Request, res: Response) => {
  try {
    const book = await db.get(
      "SELECT * FROM books WHERE id = ?",
      req.params.id
    );
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    const features = await db.all(
      "SELECT * FROM book_features WHERE book_id = ?",
      req.params.id
    );

    res.json({ ...book, features });
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).json({ error: "Failed to fetch book" });
  }
});

// POST create a new book
app.post("/api/books", async (req: Request, res: Response) => {
  try {
    const result = await db.run("INSERT INTO books DEFAULT VALUES");
    const newBook = { id: result.lastID, features: [] };
    res.status(201).json(newBook);
  } catch (error) {
    console.error("Error saving book:", error);
    res.status(500).json({ error: "Failed to save book" });
  }
});

// PUT update an existing book (only features can be updated)
app.put("/api/books/:id", async (req: Request, res: Response) => {
  const { features = [] } = req.body;
  const bookId = req.params.id;

  try {
    const book = await db.get("SELECT * FROM books WHERE id = ?", bookId);
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.json({ id: parseInt(bookId), features });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ error: "Failed to update book" });
  }
});

// DELETE a book
app.delete("/api/books/:id", async (req: Request, res: Response) => {
  try {
    await db.run("DELETE FROM book_features WHERE book_id = ?", req.params.id);
    const result = await db.run(
      "DELETE FROM books WHERE id = ?",
      req.params.id
    );

    if (result.changes === 0) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    res.status(204).end();
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ error: "Failed to delete book" });
  }
});

// POST create a new feature for a book
app.post("/api/books/:bookId/features", async (req: Request, res: Response) => {
  const bookId = req.params.bookId;
  const { subject, name, how_to_teach } = req.body;

  if (!subject || !name || !how_to_teach) {
    res
      .status(400)
      .json({ error: "Subject, name, and howToTeach are required" });
    return;
  }

  try {
    const book = await db.get("SELECT * FROM books WHERE id = ?", bookId);
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    const result = await db.run(
      "INSERT INTO book_features (book_id, subject, name, how_to_teach) VALUES (?, ?, ?, ?)",
      [bookId, subject, name, how_to_teach]
    );

    const newFeature = {
      id: result.lastID,
      book_id: parseInt(bookId),
      subject,
      name,
      how_to_teach,
    };
    res.status(201).json(newFeature);
  } catch (error) {
    console.error("Error saving feature:", error);
    res.status(500).json({ error: "Failed to save feature" });
  }
});

// PUT update an existing feature
app.put("/api/features/:id", async (req: Request, res: Response) => {
  const { subject, name, how_to_teach } = req.body;
  const featureId = req.params.id;

  if (!subject || !name || !how_to_teach) {
    res
      .status(400)
      .json({ error: "Subject, name, and howToTeach are required" });
    return;
  }

  try {
    const result = await db.run(
      "UPDATE book_features SET subject = ?, name = ?, how_to_teach = ? WHERE id = ?",
      [subject, name, how_to_teach, featureId]
    );

    if (result.changes === 0) {
      res.status(404).json({ error: "Feature not found" });
      return;
    }

    res.json({
      id: parseInt(featureId),
      subject,
      name,
      how_to_teach: how_to_teach,
    });
  } catch (error) {
    console.error("Error updating feature:", error);
    res.status(500).json({ error: "Failed to update feature" });
  }
});

// DELETE a feature
app.delete("/api/features/:id", async (req: Request, res: Response) => {
  try {
    const result = await db.run(
      "DELETE FROM book_features WHERE id = ?",
      req.params.id
    );

    if (result.changes === 0) {
      res.status(404).json({ error: "Feature not found" });
      return;
    }

    res.status(204).end();
  } catch (error) {
    console.error("Error deleting feature:", error);
    res.status(500).json({ error: "Failed to delete feature" });
  }
});

// Grade endpoints
app.get("/api/grades", async (req: Request, res: Response) => {
  try {
    const grades = await db.all("SELECT * FROM grades");
    res.json(grades);
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});

app.get("/api/grades/:id", async (req: Request, res: Response) => {
  try {
    const grade = await db.get("SELECT * FROM grades WHERE id = ?", req.params.id);
    if (!grade) {
      res.status(404).json({ error: "Grade not found" });
      return;
    }
    res.json(grade);
  } catch (error) {
    console.error("Error fetching grade:", error);
    res.status(500).json({ error: "Failed to fetch grade" });
  }
});

app.post("/api/grades", async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  try {
    const result = await db.run("INSERT INTO grades (name) VALUES (?)", name);
    const id = result.lastID;
    const grade = await db.get("SELECT * FROM grades WHERE id = ?", id);
    res.status(201).json(grade);
  } catch (error) {
    console.error("Error creating grade:", error);
    res.status(500).json({ error: "Failed to create grade" });
  }
});

app.put("/api/grades/:id", async (req: Request, res: Response) => {
  const { name } = req.body;
  const id = req.params.id;

  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  try {
    await db.run("UPDATE grades SET name = ? WHERE id = ?", [name, id]);
    const grade = await db.get("SELECT * FROM grades WHERE id = ?", id);
    if (!grade) {
      res.status(404).json({ error: "Grade not found" });
      return;
    }
    res.json(grade);
  } catch (error) {
    console.error("Error updating grade:", error);
    res.status(500).json({ error: "Failed to update grade" });
  }
});

app.delete("/api/grades/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    // Check if grade is being used by any children or subjects before deleting
    const childrenUsingGrade = await db.get("SELECT COUNT(*) as count FROM children WHERE grade_id = ?", id);
    const subjectsUsingGrade = await db.get("SELECT COUNT(*) as count FROM subjects WHERE grade_id = ?", id);
    const personasUsingGrade = await db.get("SELECT COUNT(*) as count FROM teacher_personas WHERE grade_id = ?", id);

    if (childrenUsingGrade.count > 0 || subjectsUsingGrade.count > 0 || personasUsingGrade.count > 0) {
      res.status(400).json({ error: "Cannot delete grade as it is referenced by children, subjects, or teacher personas" });
      return;
    }

    await db.run("DELETE FROM grades WHERE id = ?", id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting grade:", error);
    res.status(500).json({ error: "Failed to delete grade" });
  }
});

// Subject endpoints
app.get("/api/subjects", async (req: Request, res: Response) => {
  try {
    const subjects = await db.all("SELECT * FROM subjects");
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

app.get("/api/subjects/:id", async (req: Request, res: Response) => {
  try {
    const subject = await db.get("SELECT * FROM subjects WHERE id = ?", req.params.id);
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }
    res.json(subject);
  } catch (error) {
    console.error("Error fetching subject:", error);
    res.status(500).json({ error: "Failed to fetch subject" });
  }
});

app.post("/api/subjects", async (req: Request, res: Response) => {
  const { name, grade_id, book_id, default_teacher_id } = req.body;

  if (!name || !grade_id) {
    res.status(400).json({ error: "Name and grade_id are required" });
    return;
  }

  try {
    // Verify that the grade_id exists
    const gradeExists = await db.get("SELECT id FROM grades WHERE id = ?", grade_id);
    if (!gradeExists) {
      res.status(400).json({ error: "Invalid grade_id" });
      return;
    }
    
    // Verify book_id if provided
    if (book_id) {
      const bookExists = await db.get("SELECT id FROM books WHERE id = ?", book_id);
      if (!bookExists) {
        res.status(400).json({ error: "Invalid book_id" });
        return;
      }
    }
    
    // Verify teacher_id if provided
    if (default_teacher_id) {
      const teacherExists = await db.get("SELECT id FROM teachers WHERE id = ?", default_teacher_id);
      if (!teacherExists) {
        res.status(400).json({ error: "Invalid default_teacher_id" });
        return;
      }
    }

    const result = await db.run(
      "INSERT INTO subjects (name, grade_id, book_id, default_teacher_id) VALUES (?, ?, ?, ?)", 
      [name, grade_id, book_id || null, default_teacher_id || null]
    );
    const id = result.lastID;
    const subject = await db.get("SELECT * FROM subjects WHERE id = ?", id);
    res.status(201).json(subject);
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({ error: "Failed to create subject" });
  }
});

app.put("/api/subjects/:id", async (req: Request, res: Response) => {
  const { name, grade_id, book_id, default_teacher_id } = req.body;
  const id = req.params.id;

  if (!name || !grade_id) {
    res.status(400).json({ error: "Name and grade_id are required" });
    return;
  }

  try {
    // Verify that the grade_id exists
    const gradeExists = await db.get("SELECT id FROM grades WHERE id = ?", grade_id);
    if (!gradeExists) {
      res.status(400).json({ error: "Invalid grade_id" });
      return;
    }
    
    // Verify book_id if provided
    if (book_id) {
      const bookExists = await db.get("SELECT id FROM books WHERE id = ?", book_id);
      if (!bookExists) {
        res.status(400).json({ error: "Invalid book_id" });
        return;
      }
    }
    
    // Verify teacher_id if provided
    if (default_teacher_id) {
      const teacherExists = await db.get("SELECT id FROM teachers WHERE id = ?", default_teacher_id);
      if (!teacherExists) {
        res.status(400).json({ error: "Invalid default_teacher_id" });
        return;
      }
    }

    await db.run(
      "UPDATE subjects SET name = ?, grade_id = ?, book_id = ?, default_teacher_id = ? WHERE id = ?", 
      [name, grade_id, book_id || null, default_teacher_id || null, id]
    );
    const subject = await db.get("SELECT * FROM subjects WHERE id = ?", id);
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }
    res.json(subject);
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({ error: "Failed to update subject" });
  }
});

app.delete("/api/subjects/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    // Check if subject is being used by any relationships before deleting
    const chaptersUsingSubject = await db.get("SELECT COUNT(*) as count FROM chapters WHERE subject_id = ?", id);
    const childSubjectsCount = await db.get("SELECT COUNT(*) as count FROM child_subjects WHERE subject_id = ?", id);
    const teacherSubjectsCount = await db.get("SELECT COUNT(*) as count FROM teacher_subjects WHERE subject_id = ?", id);

    if (chaptersUsingSubject.count > 0 || childSubjectsCount.count > 0 || teacherSubjectsCount.count > 0) {
      res.status(400).json({ error: "Cannot delete subject as it is referenced by chapters, children, or teachers" });
      return;
    }

    await db.run("DELETE FROM subjects WHERE id = ?", id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ error: "Failed to delete subject" });
  }
});

// Teacher endpoints
app.get("/api/teachers", async (req: Request, res: Response) => {
  try {
    const teachers = await db.all("SELECT * FROM teachers");
    res.json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
});

app.get("/api/teachers/:id", async (req: Request, res: Response) => {
  try {
    const teacher = await db.get("SELECT * FROM teachers WHERE id = ?", req.params.id);
    if (!teacher) {
      res.status(404).json({ error: "Teacher not found" });
      return;
    }
    res.json(teacher);
  } catch (error) {
    console.error("Error fetching teacher:", error);
    res.status(500).json({ error: "Failed to fetch teacher" });
  }
});

app.post("/api/teachers", async (req: Request, res: Response) => {
  const { name, persona_id, teaching_style } = req.body;

  if (!name || !teaching_style) {
    res.status(400).json({ error: "Name and teaching style are required" });
    return;
  }

  try {
    const result = await db.run("INSERT INTO teachers (name, persona_id, teaching_style) VALUES (?, ?, ?)", [name, persona_id, teaching_style]);
    const id = result.lastID;
    const teacher = await db.get("SELECT * FROM teachers WHERE id = ?", id);
    res.status(201).json(teacher);
  } catch (error) {
    console.error("Error creating teacher:", error);
    res.status(500).json({ error: "Failed to create teacher" });
  }
});

app.put("/api/teachers/:id", async (req: Request, res: Response) => {
  const { name, persona_id, teaching_style } = req.body;
  const id = req.params.id;

  if (!name || !teaching_style) {
    res.status(400).json({ error: "Name and teaching style are required" });
    return;
  }

  try {
    await db.run("UPDATE teachers SET name = ?, persona_id = ?, teaching_style = ? WHERE id = ?", [name, persona_id, teaching_style, id]);
    const teacher = await db.get("SELECT * FROM teachers WHERE id = ?", id);
    if (!teacher) {
      res.status(404).json({ error: "Teacher not found" });
      return;
    }
    res.json(teacher);
  } catch (error) {
    console.error("Error updating teacher:", error);
    res.status(500).json({ error: "Failed to update teacher" });
  }
});

app.delete("/api/teachers/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    // Check if teacher is being used by any relationships before deleting
    const teacherSubjectsCount = await db.get("SELECT COUNT(*) as count FROM teacher_subjects WHERE teacher_id = ?", id);

    if (teacherSubjectsCount.count > 0) {
      res.status(400).json({ error: "Cannot delete teacher as they are assigned to subjects" });
      return;
    }

    await db.run("DELETE FROM teachers WHERE id = ?", id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting teacher:", error);
    res.status(500).json({ error: "Failed to delete teacher" });
  }
});

// Chapter endpoints
app.get("/api/chapters", async (req: Request, res: Response) => {
  try {
    const chapters = await db.all("SELECT * FROM chapters");
    res.json(chapters);
  } catch (error) {
    console.error("Error fetching chapters:", error);
    res.status(500).json({ error: "Failed to fetch chapters" });
  }
});

app.get("/api/chapters/:id", async (req: Request, res: Response) => {
  try {
    const chapter = await db.get("SELECT * FROM chapters WHERE id = ?", req.params.id);
    if (!chapter) {
      res.status(404).json({ error: "Chapter not found" });
      return;
    }
    res.json(chapter);
  } catch (error) {
    console.error("Error fetching chapter:", error);
    res.status(500).json({ error: "Failed to fetch chapter" });
  }
});

app.get("/api/subjects/:id/chapters", async (req: Request, res: Response) => {
  try {
    const subject = await db.get("SELECT * FROM subjects WHERE id = ?", req.params.id);
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    const chapters = await db.all("SELECT * FROM chapters WHERE subject_id = ?", req.params.id);
    res.json(chapters);
  } catch (error) {
    console.error("Error fetching subject's chapters:", error);
    res.status(500).json({ error: "Failed to fetch subject's chapters" });
  }
});

app.post("/api/chapters", async (req: Request, res: Response) => {
  const { name, subject_id } = req.body;

  if (!name || !subject_id) {
    res.status(400).json({ error: "Name and subject_id are required" });
    return;
  }

  try {
    // Verify that the subject_id exists
    const subjectExists = await db.get("SELECT id FROM subjects WHERE id = ?", subject_id);
    if (!subjectExists) {
      res.status(400).json({ error: "Invalid subject_id" });
      return;
    }

    const result = await db.run("INSERT INTO chapters (name, subject_id) VALUES (?, ?)", [name, subject_id]);
    const id = result.lastID;
    const chapter = await db.get("SELECT * FROM chapters WHERE id = ?", id);
    res.status(201).json(chapter);
  } catch (error) {
    console.error("Error creating chapter:", error);
    res.status(500).json({ error: "Failed to create chapter" });
  }
});

app.put("/api/chapters/:id", async (req: Request, res: Response) => {
  const { name, subject_id } = req.body;
  const id = req.params.id;

  if (!name || !subject_id) {
    res.status(400).json({ error: "Name and subject_id are required" });
    return;
  }

  try {
    // Verify that the subject_id exists
    const subjectExists = await db.get("SELECT id FROM subjects WHERE id = ?", subject_id);
    if (!subjectExists) {
      res.status(400).json({ error: "Invalid subject_id" });
      return;
    }

    await db.run("UPDATE chapters SET name = ?, subject_id = ? WHERE id = ?", [name, subject_id, id]);
    const chapter = await db.get("SELECT * FROM chapters WHERE id = ?", id);
    if (!chapter) {
      res.status(404).json({ error: "Chapter not found" });
      return;
    }
    res.json(chapter);
  } catch (error) {
    console.error("Error updating chapter:", error);
    res.status(500).json({ error: "Failed to update chapter" });
  }
});

app.delete("/api/chapters/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    // Check if chapter is being used by any topic mappings before deleting
    const topicMappingsCount = await db.get("SELECT COUNT(*) as count FROM topic_chapter_mapping WHERE chapter_id = ?", id);

    if (topicMappingsCount.count > 0) {
      res.status(400).json({ error: "Cannot delete chapter as it has topics associated with it" });
      return;
    }

    await db.run("DELETE FROM chapters WHERE id = ?", id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting chapter:", error);
    res.status(500).json({ error: "Failed to delete chapter" });
  }
});

// Children endpoints
app.get("/api/children", async (req: Request, res: Response) => {
  try {
    const children = await db.all("SELECT * FROM children");
    res.json(children);
  } catch (error) {
    console.error("Error fetching children:", error);
    res.status(500).json({ error: "Failed to fetch children" });
  }
});

app.get("/api/children/:id", async (req: Request, res: Response) => {
  try {
    const child = await db.get("SELECT * FROM children WHERE id = ?", req.params.id);
    if (!child) {
      res.status(404).json({ error: "Child not found" });
      return;
    }
    res.json(child);
  } catch (error) {
    console.error("Error fetching child:", error);
    res.status(500).json({ error: "Failed to fetch child" });
  }
});

app.post("/api/children", async (req: Request, res: Response) => {
  const { name, grade_id } = req.body;

  if (!name || !grade_id) {
    res.status(400).json({ error: "Name and grade_id are required" });
    return;
  }

  try {
    // Verify that the grade_id exists
    const gradeExists = await db.get("SELECT id FROM grades WHERE id = ?", grade_id);
    if (!gradeExists) {
      res.status(400).json({ error: "Invalid grade_id" });
      return;
    }

    const result = await db.run("INSERT INTO children (name, grade_id) VALUES (?, ?)", [name, grade_id]);
    const id = result.lastID;
    const child = await db.get("SELECT * FROM children WHERE id = ?", id);
    res.status(201).json(child);
  } catch (error) {
    console.error("Error creating child:", error);
    res.status(500).json({ error: "Failed to create child" });
  }
});

app.put("/api/children/:id", async (req: Request, res: Response) => {
  const { name, grade_id } = req.body;
  const id = req.params.id;

  if (!name || !grade_id) {
    res.status(400).json({ error: "Name and grade_id are required" });
    return;
  }

  try {
    // Verify that the grade_id exists
    const gradeExists = await db.get("SELECT id FROM grades WHERE id = ?", grade_id);
    if (!gradeExists) {
      res.status(400).json({ error: "Invalid grade_id" });
      return;
    }

    await db.run("UPDATE children SET name = ?, grade_id = ? WHERE id = ?", [name, grade_id, id]);
    const child = await db.get("SELECT * FROM children WHERE id = ?", id);
    if (!child) {
      res.status(404).json({ error: "Child not found" });
      return;
    }
    res.json(child);
  } catch (error) {
    console.error("Error updating child:", error);
    res.status(500).json({ error: "Failed to update child" });
  }
});

app.delete("/api/children/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    // Check if child is being used by any relationships before deleting
    const lessonPlansCount = await db.get("SELECT COUNT(*) as count FROM lesson_plans WHERE child_id = ?", id);
    const childSubjectsCount = await db.get("SELECT COUNT(*) as count FROM child_subjects WHERE child_id = ?", id);
    const learningLevelsCount = await db.get("SELECT COUNT(*) as count FROM learning_levels WHERE child_id = ?", id);

    if (lessonPlansCount.count > 0 || childSubjectsCount.count > 0 || learningLevelsCount.count > 0) {
      res.status(400).json({ error: "Cannot delete child as they are associated with lesson plans, subjects, or learning levels" });
      return;
    }

    await db.run("DELETE FROM children WHERE id = ?", id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting child:", error);
    res.status(500).json({ error: "Failed to delete child" });
  }
});

// Topic endpoints
app.get("/api/topics", async (req: Request, res: Response) => {
  try {
    const topics = await db.all("SELECT * FROM topics");
    // Fetch chapter mappings for all topics
    const mappings = await db.all("SELECT * FROM topic_chapter_mapping");
    const topicsWithChapters = topics.map((topic: any) => ({
      ...topic,
      chapter_ids: mappings.filter((m: any) => m.topic_id === topic.id).map((m: any) => m.chapter_id)
    }));
    res.json(topicsWithChapters);
  } catch (error) {
    console.error("Error fetching topics:", error);
    res.status(500).json({ error: "Failed to fetch topics" });
  }
});

app.get("/api/topics/:id", async (req: Request, res: Response) => {
  try {
    const topic = await db.get("SELECT * FROM topics WHERE id = ?", req.params.id);
    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }
    // Fetch chapter mappings for this topic
    const mappings = await db.all("SELECT chapter_id FROM topic_chapter_mapping WHERE topic_id = ?", req.params.id);
    const topicWithChapters = {
      ...topic,
      chapter_ids: mappings.map((m: any) => m.chapter_id)
    };
    res.json(topicWithChapters);
  } catch (error) {
    console.error("Error fetching topic:", error);
    res.status(500).json({ error: "Failed to fetch topic" });
  }
});

app.get("/api/chapters/:id/topics", async (req: Request, res: Response) => {
  try {
    const chapter = await db.get("SELECT * FROM chapters WHERE id = ?", req.params.id);
    if (!chapter) {
      res.status(404).json({ error: "Chapter not found" });
      return;
    }

    // Get topics via the mapping table
    const topics = await db.all(`
      SELECT t.* FROM topics t
      JOIN topic_chapter_mapping tcm ON t.id = tcm.topic_id
      WHERE tcm.chapter_id = ?
    `, req.params.id);
    
    // Also fetch all chapter_ids for each topic
    const allMappings = await db.all("SELECT * FROM topic_chapter_mapping");
    const topicsWithChapters = topics.map((topic: any) => ({
      ...topic,
      chapter_ids: allMappings.filter((m: any) => m.topic_id === topic.id).map((m: any) => m.chapter_id)
    }));
    
    res.json(topicsWithChapters);
  } catch (error) {
    console.error("Error fetching chapter's topics:", error);
    res.status(500).json({ error: "Failed to fetch chapter's topics" });
  }
});

app.post("/api/topics", async (req: Request, res: Response) => {
  const { name, chapter_ids } = req.body;

  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  try {
    // Verify that all chapter_ids exist if provided
    if (chapter_ids && Array.isArray(chapter_ids) && chapter_ids.length > 0) {
      for (const chapterId of chapter_ids) {
        const chapterExists = await db.get("SELECT id FROM chapters WHERE id = ?", chapterId);
        if (!chapterExists) {
          res.status(400).json({ error: `Invalid chapter_id: ${chapterId}` });
          return;
        }
      }
    }

    // Create the topic (without chapter_id in the topics table)
    const result = await db.run("INSERT INTO topics (name) VALUES (?)", [name]);
    const topicId = result.lastID;

    // Create chapter mappings
    if (chapter_ids && Array.isArray(chapter_ids)) {
      for (const chapterId of chapter_ids) {
        await db.run("INSERT INTO topic_chapter_mapping (topic_id, chapter_id) VALUES (?, ?)", [topicId, chapterId]);
      }
    }

    const topic = await db.get("SELECT * FROM topics WHERE id = ?", topicId);
    res.status(201).json({ ...topic, chapter_ids: chapter_ids || [] });
  } catch (error) {
    console.error("Error creating topic:", error);
    res.status(500).json({ error: "Failed to create topic" });
  }
});

app.put("/api/topics/:id", async (req: Request, res: Response) => {
  const { name, chapter_ids } = req.body;
  const id = req.params.id;

  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  try {
    // Check if topic exists
    const existingTopic = await db.get("SELECT * FROM topics WHERE id = ?", id);
    if (!existingTopic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    // Verify that all chapter_ids exist if provided
    if (chapter_ids && Array.isArray(chapter_ids) && chapter_ids.length > 0) {
      for (const chapterId of chapter_ids) {
        const chapterExists = await db.get("SELECT id FROM chapters WHERE id = ?", chapterId);
        if (!chapterExists) {
          res.status(400).json({ error: `Invalid chapter_id: ${chapterId}` });
          return;
        }
      }
    }

    // Update the topic name
    await db.run("UPDATE topics SET name = ? WHERE id = ?", [name, id]);

    // Update chapter mappings: delete existing and insert new ones
    await db.run("DELETE FROM topic_chapter_mapping WHERE topic_id = ?", id);
    if (chapter_ids && Array.isArray(chapter_ids)) {
      for (const chapterId of chapter_ids) {
        await db.run("INSERT INTO topic_chapter_mapping (topic_id, chapter_id) VALUES (?, ?)", [id, chapterId]);
      }
    }

    const topic = await db.get("SELECT * FROM topics WHERE id = ?", id);
    res.json({ ...topic, chapter_ids: chapter_ids || [] });
  } catch (error) {
    console.error("Error updating topic:", error);
    res.status(500).json({ error: "Failed to update topic" });
  }
});

app.delete("/api/topics/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    // Check if topic is being used by any relationships before deleting
    const prerequisitesCount = await db.get("SELECT COUNT(*) as count FROM topic_prerequisites WHERE prerequisite_topic_id = ?", [id, id]);
    const lessonPlansCount = await db.get("SELECT COUNT(*) as count FROM lesson_plans WHERE topic_id = ?", id);
    const learningIndicatorsCount = await db.get("SELECT COUNT(*) as count FROM learning_indicators WHERE topic_id = ?", id);

    if (prerequisitesCount.count > 0 || lessonPlansCount.count > 0 || learningIndicatorsCount.count > 0) {
      res.status(400).json({ error: "Cannot delete topic as it is referenced by prerequisites, lesson plans, or learning indicators" });
      return;
    }

    // Delete chapter mappings first
    await db.run("DELETE FROM topic_chapter_mapping WHERE topic_id = ?", id);
    await db.run("DELETE FROM topics WHERE id = ?", id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting topic:", error);
    res.status(500).json({ error: "Failed to delete topic" });
  }
});

// Topic-Chapter mapping endpoints
app.get("/api/topics/:id/chapters", async (req: Request, res: Response) => {
  try {
    const topic = await db.get("SELECT * FROM topics WHERE id = ?", req.params.id);
    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    const chapters = await db.all(`
      SELECT c.*, tcm.id as mapping_id FROM chapters c
      JOIN topic_chapter_mapping tcm ON c.id = tcm.chapter_id
      WHERE tcm.topic_id = ?
    `, req.params.id);
    res.json(chapters);
  } catch (error) {
    console.error("Error fetching topic's chapters:", error);
    res.status(500).json({ error: "Failed to fetch topic's chapters" });
  }
});

app.post("/api/topics/:id/chapters", async (req: Request, res: Response) => {
  const { chapter_id } = req.body;
  const topic_id = req.params.id;

  if (!chapter_id) {
    res.status(400).json({ error: "chapter_id is required" });
    return;
  }

  try {
    // Verify topic exists
    const topicExists = await db.get("SELECT id FROM topics WHERE id = ?", topic_id);
    if (!topicExists) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    // Verify chapter exists
    const chapterExists = await db.get("SELECT id FROM chapters WHERE id = ?", chapter_id);
    if (!chapterExists) {
      res.status(400).json({ error: "Invalid chapter_id" });
      return;
    }

    // Check if mapping already exists
    const existingMapping = await db.get("SELECT * FROM topic_chapter_mapping WHERE topic_id = ? AND chapter_id = ?", [topic_id, chapter_id]);
    if (existingMapping) {
      res.status(400).json({ error: "This topic-chapter mapping already exists" });
      return;
    }

    await db.run("INSERT INTO topic_chapter_mapping (topic_id, chapter_id) VALUES (?, ?)", [topic_id, chapter_id]);
    res.status(201).json({ topic_id: parseInt(topic_id), chapter_id });
  } catch (error) {
    console.error("Error adding chapter to topic:", error);
    res.status(500).json({ error: "Failed to add chapter to topic" });
  }
});

app.delete("/api/topics/:id/chapters/:chapterId", async (req: Request, res: Response) => {
  const topic_id = req.params.id;
  const chapter_id = req.params.chapterId;

  try {
    const result = await db.run("DELETE FROM topic_chapter_mapping WHERE topic_id = ? AND chapter_id = ?", [topic_id, chapter_id]);

    if (result.changes === 0) {
      res.status(404).json({ error: "Topic-chapter mapping not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error removing chapter from topic:", error);
    res.status(500).json({ error: "Failed to remove chapter from topic" });
  }
});

// Topic prerequisites endpoints
app.get("/api/topics/:id/prerequisites", async (req: Request, res: Response) => {
  try {
    const topic = await db.get("SELECT * FROM topics WHERE id = ?", req.params.id);
    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    const prerequisites = await db.all(`
      SELECT t.* FROM topics t
      JOIN topic_prerequisites tp ON t.id = tp.prerequisite_topic_id
      WHERE tp.topic_id = ?
    `, req.params.id);
    res.json(prerequisites);
  } catch (error) {
    console.error("Error fetching topic prerequisites:", error);
    res.status(500).json({ error: "Failed to fetch topic prerequisites" });
  }
});

app.post("/api/topics/:id/prerequisites", async (req: Request, res: Response) => {
  const { prerequisite_topic_id } = req.body;
  const topic_id = req.params.id;

  if (!prerequisite_topic_id) {
    res.status(400).json({ error: "Prerequisite topic ID is required" });
    return;
  }

  try {
    // Verify both topics exist
    const topicExists = await db.get("SELECT id FROM topics WHERE id = ?", topic_id);
    if (!topicExists) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    const prerequisiteExists = await db.get("SELECT id FROM topics WHERE id = ?", prerequisite_topic_id);
    if (!prerequisiteExists) {
      res.status(404).json({ error: "Prerequisite topic not found" });
      return;
    }

    // Check if already exists
    const existingPrereq = await db.get("SELECT * FROM topic_prerequisites WHERE topic_id = ? AND prerequisite_topic_id = ?", [topic_id, prerequisite_topic_id]);
    if (existingPrereq) {
      res.status(400).json({ error: "This prerequisite relationship already exists" });
      return;
    }

    // Prevent circular references
    const reversePrereq = await db.get("SELECT * FROM topic_prerequisites WHERE topic_id = ? AND prerequisite_topic_id = ?", [prerequisite_topic_id, topic_id]);
    if (reversePrereq) {
      res.status(400).json({ error: "Cannot create circular prerequisite relationship" });
      return;
    }

    await db.run("INSERT INTO topic_prerequisites (topic_id, prerequisite_topic_id) VALUES (?, ?)", [topic_id, prerequisite_topic_id]);
    res.status(201).json({ topic_id, prerequisite_topic_id });
  } catch (error) {
    console.error("Error adding prerequisite:", error);
    res.status(500).json({ error: "Failed to add prerequisite" });
  }
});

app.delete("/api/topics/:id/prerequisites/:prerequisiteId", async (req: Request, res: Response) => {
  const topic_id = req.params.id;
  const prerequisite_topic_id = req.params.prerequisiteId;

  try {
    const result = await db.run("DELETE FROM topic_prerequisites WHERE topic_id = ? AND prerequisite_topic_id = ?", [topic_id, prerequisite_topic_id]);

    if (result.changes === 0) {
      res.status(404).json({ error: "Prerequisite relationship not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error removing prerequisite:", error);
    res.status(500).json({ error: "Failed to remove prerequisite" });
  }
});

// Lesson Plan endpoints
app.get("/api/lesson-plans", async (req: Request, res: Response) => {
  try {
    const lessonPlans = await db.all("SELECT * FROM lesson_plans");
    res.json(lessonPlans);
  } catch (error) {
    console.error("Error fetching lesson plans:", error);
    res.status(500).json({ error: "Failed to fetch lesson plans" });
  }
});

app.get("/api/lesson-plans/:id", async (req: Request, res: Response) => {
  try {
    const lessonPlan = await db.get("SELECT * FROM lesson_plans WHERE id = ?", req.params.id);
    if (!lessonPlan) {
      res.status(404).json({ error: "Lesson plan not found" });
      return;
    }
    res.json(lessonPlan);
  } catch (error) {
    console.error("Error fetching lesson plan:", error);
    res.status(500).json({ error: "Failed to fetch lesson plan" });
  }
});

app.get("/api/children/:id/lesson-plans", async (req: Request, res: Response) => {
  try {
    const child = await db.get("SELECT * FROM children WHERE id = ?", req.params.id);
    if (!child) {
      res.status(404).json({ error: "Child not found" });
      return;
    }

    const lessonPlans = await db.all("SELECT * FROM lesson_plans WHERE child_id = ?", req.params.id);
    res.json(lessonPlans);
  } catch (error) {
    console.error("Error fetching child's lesson plans:", error);
    res.status(500).json({ error: "Failed to fetch child's lesson plans" });
  }
});

app.get("/api/topics/:id/lesson-plans", async (req: Request, res: Response) => {
  try {
    const topic = await db.get("SELECT * FROM topics WHERE id = ?", req.params.id);
    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    const lessonPlans = await db.all("SELECT * FROM lesson_plans WHERE topic_id = ?", req.params.id);
    res.json(lessonPlans);
  } catch (error) {
    console.error("Error fetching topic's lesson plans:", error);
    res.status(500).json({ error: "Failed to fetch topic's lesson plans" });
  }
});

app.post("/api/lesson-plans", async (req: Request, res: Response) => {
  const { title, topic_id, teacher_id, learning_level_id, duration_minutes, objectives } = req.body;

  if (!title || !topic_id || !teacher_id || !learning_level_id || !duration_minutes || !objectives) {
    res.status(400).json({ error: "Title, topic ID, teacher ID, learning level, duration, and objectives are required" });
    return;
  }

  try {
    // Verify that the topic_id and teacher_id exist
    const topicExists = await db.get("SELECT id FROM topics WHERE id = ?", topic_id);
    if (!topicExists) {
      res.status(400).json({ error: "Invalid topic_id" });
      return;
    }

    const teacherExists = await db.get("SELECT id FROM teachers WHERE id = ?", teacher_id);
    if (!teacherExists) {
      res.status(400).json({ error: "Invalid teacher_id" });
      return;
    }

    // Verify that learning_level_id is between 1 and 5
    if (learning_level_id < 1 || learning_level_id > 5) {
      res.status(400).json({ error: "Learning level must be between 1 and 5" });
      return;
    }

    const result = await db.run(
      "INSERT INTO lesson_plans (title, topic_id, teacher_id, learning_level_id, duration_minutes, objectives) VALUES (?, ?, ?, ?, ?, ?)",
      [title, topic_id, teacher_id, learning_level_id, duration_minutes, objectives]
    );
    const id = result.lastID;
    const lessonPlan = await db.get("SELECT * FROM lesson_plans WHERE id = ?", id);
    res.status(201).json(lessonPlan);
  } catch (error) {
    console.error("Error creating lesson plan:", error);
    res.status(500).json({ error: "Failed to create lesson plan" });
  }
});

app.put("/api/lesson-plans/:id", async (req: Request, res: Response) => {
  const { title, topic_id, teacher_id, learning_level_id, duration_minutes, objectives } = req.body;
  const id = req.params.id;

  if (!title || !topic_id || !teacher_id || !learning_level_id || !duration_minutes || !objectives) {
    res.status(400).json({ error: "Title, topic ID, teacher ID, learning level, duration, and objectives are required" });
    return;
  }

  try {
    // Verify that the topic_id and teacher_id exist
    const topicExists = await db.get("SELECT id FROM topics WHERE id = ?", topic_id);
    if (!topicExists) {
      res.status(400).json({ error: "Invalid topic_id" });
      return;
    }

    const teacherExists = await db.get("SELECT id FROM teachers WHERE id = ?", teacher_id);
    if (!teacherExists) {
      res.status(400).json({ error: "Invalid teacher_id" });
      return;
    }

    // Verify that learning_level_id is between 1 and 5
    if (learning_level_id < 1 || learning_level_id > 5) {
      res.status(400).json({ error: "Learning level must be between 1 and 5" });
      return;
    }

    await db.run(
      "UPDATE lesson_plans SET title = ?, topic_id = ?, teacher_id = ?, learning_level_id = ?, duration_minutes = ?, objectives = ? WHERE id = ?",
      [title, topic_id, teacher_id, learning_level_id, duration_minutes, objectives, id]
    );
    const lessonPlan = await db.get("SELECT * FROM lesson_plans WHERE id = ?", id);

    if (!lessonPlan) {
      res.status(404).json({ error: "Lesson plan not found" });
      return;
    }

    res.json(lessonPlan);
  } catch (error) {
    console.error("Error updating lesson plan:", error);
    res.status(500).json({ error: "Failed to update lesson plan" });
  }
});

app.delete("/api/lesson-plans/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    // Check if lesson plan is being used by any lesson sections before deleting
    const sectionsCount = await db.get("SELECT COUNT(*) as count FROM lesson_sections WHERE lesson_plan_id = ?", id);

    if (sectionsCount.count > 0) {
      res.status(400).json({ error: "Cannot delete lesson plan as it has sections associated with it" });
      return;
    }

    await db.run("DELETE FROM lesson_plans WHERE id = ?", id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting lesson plan:", error);
    res.status(500).json({ error: "Failed to delete lesson plan" });
  }
});

// Lesson Section endpoints
app.get("/api/lesson-sections", async (req: Request, res: Response) => {
  try {
    const lessonSections = await db.all("SELECT * FROM lesson_sections");
    res.json(lessonSections);
  } catch (error) {
    console.error("Error fetching lesson sections:", error);
    res.status(500).json({ error: "Failed to fetch lesson sections" });
  }
});

app.get("/api/lesson-sections/:id", async (req: Request, res: Response) => {
  try {
    const lessonSection = await db.get("SELECT * FROM lesson_sections WHERE id = ?", req.params.id);
    if (!lessonSection) {
      res.status(404).json({ error: "Lesson section not found" });
      return;
    }
    res.json(lessonSection);
  } catch (error) {
    console.error("Error fetching lesson section:", error);
    res.status(500).json({ error: "Failed to fetch lesson section" });
  }
});

app.get("/api/lesson-plans/:id/sections", async (req: Request, res: Response) => {
  try {
    const lessonPlan = await db.get("SELECT * FROM lesson_plans WHERE id = ?", req.params.id);
    if (!lessonPlan) {
      res.status(404).json({ error: "Lesson plan not found" });
      return;
    }

    const sections = await db.all("SELECT * FROM lesson_sections WHERE lesson_plan_id = ?", req.params.id);
    res.json(sections);
  } catch (error) {
    console.error("Error fetching lesson plan sections:", error);
    res.status(500).json({ error: "Failed to fetch lesson plan sections" });
  }
});

app.post("/api/lesson-sections", async (req: Request, res: Response) => {
  const { lesson_plan_id, type, teaching_pedagogy, duration_minutes, order_index } = req.body;

  if (!lesson_plan_id || !type || !teaching_pedagogy || !duration_minutes || !order_index) {
    res.status(400).json({ error: "Lesson plan ID, type, teaching pedagogy, duration minutes, and order index are required" });
    return;
  }

  try {
    // Verify that the lesson_plan_id exists
    const lessonPlanExists = await db.get("SELECT id FROM lesson_plans WHERE id = ?", lesson_plan_id);
    if (!lessonPlanExists) {
      res.status(400).json({ error: "Invalid lesson_plan_id" });
      return;
    }

    // Validate the type
    if (!['Introduction', 'I Do', 'We Do', 'You Do', 'Assessment', 'Homework'].includes(type)) {
      res.status(400).json({ error: "Type must be one of: 'Introduction', 'I Do', 'We Do', 'You Do', 'Assessment', 'Homework'" });
      return;
    }

    const result = await db.run(
      "INSERT INTO lesson_sections (lesson_plan_id, type, teaching_pedagogy, duration_minutes, order_index) VALUES (?, ?, ?, ?, ?)",
      [lesson_plan_id, type, teaching_pedagogy, duration_minutes, order_index]
    );
    const id = result.lastID;
    const lessonSection = await db.get("SELECT * FROM lesson_sections WHERE id = ?", id);
    res.status(201).json(lessonSection);
  } catch (error) {
    console.error("Error creating lesson section:", error);
    res.status(500).json({ error: "Failed to create lesson section" });
  }
});

app.put("/api/lesson-sections/:id", async (req: Request, res: Response) => {
  const { lesson_plan_id, type, teaching_pedagogy } = req.body;
  const id = req.params.id;

  if (!lesson_plan_id || !type || !teaching_pedagogy) {
    res.status(400).json({ error: "Lesson plan ID, type, and teaching pedagogy are required" });
    return;
  }

  try {
    // Verify that the lesson_plan_id exists
    const lessonPlanExists = await db.get("SELECT id FROM lesson_plans WHERE id = ?", lesson_plan_id);
    if (!lessonPlanExists) {
      res.status(400).json({ error: "Invalid lesson_plan_id" });
      return;
    }

    // Validate the type
    if (!['Introduction', 'I Do', 'We Do', 'You Do', 'Assessment', 'Homework'].includes(type)) {
      res.status(400).json({ error: "Type must be one of: 'Introduction', 'I Do', 'We Do', 'You Do', 'Assessment', 'Homework'" });
      return;
    }

    await db.run(
      "UPDATE lesson_sections SET lesson_plan_id = ?, type = ?, teaching_pedagogy = ? WHERE id = ?",
      [lesson_plan_id, type, teaching_pedagogy, id]
    );
    const lessonSection = await db.get("SELECT * FROM lesson_sections WHERE id = ?", id);
    if (!lessonSection) {
      res.status(404).json({ error: "Lesson section not found" });
      return;
    }
    res.json(lessonSection);
  } catch (error) {
    console.error("Error updating lesson section:", error);
    res.status(500).json({ error: "Failed to update lesson section" });
  }
});

app.delete("/api/lesson-sections/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    // Check if section has resources before deleting
    const resourcesCount = await db.get("SELECT COUNT(*) as count FROM section_resources WHERE section_id = ?", id);

    if (resourcesCount.count > 0) {
      res.status(400).json({ error: "Cannot delete lesson section as it has resources associated with it" });
      return;
    }

    await db.run("DELETE FROM lesson_sections WHERE id = ?", id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting lesson section:", error);
    res.status(500).json({ error: "Failed to delete lesson section" });
  }
});

// Resource endpoints
app.get("/api/resources", async (req: Request, res: Response) => {
  try {
    const resources = await db.all("SELECT * FROM resources");
    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

app.get("/api/resources/:id", async (req: Request, res: Response) => {
  try {
    const resource = await db.get("SELECT * FROM resources WHERE id = ?", req.params.id);
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }
    res.json(resource);
  } catch (error) {
    console.error("Error fetching resource:", error);
    res.status(500).json({ error: "Failed to fetch resource" });
  }
});

app.post("/api/resources", async (req: Request, res: Response) => {
  const { title, type, url, description } = req.body;

  if (!type || !url) {
    res.status(400).json({ error: "Type and URL are required" });
    return;
  }

  try {
    // Validate the type
    if (!['Concept Video', 'Question', 'Quiz', 'Practice Test'].includes(type)) {
      res.status(400).json({ error: "Type must be one of: 'Concept Video', 'Question', 'Quiz', 'Practice Test'" });
      return;
    }

    const result = await db.run(
      "INSERT INTO resources (title, type, url, description) VALUES (?, ?, ?, ?)",
      [title, type, url, description]
    );
    const id = result.lastID;
    const resource = await db.get("SELECT * FROM resources WHERE id = ?", id);
    res.status(201).json(resource);
  } catch (error) {
    console.error("Error creating resource:", error);
    res.status(500).json({ error: "Failed to create resource" });
  }
});

app.put("/api/resources/:id", async (req: Request, res: Response) => {
  const { title, type, url, description } = req.body;
  const id = req.params.id;

  if (!type || !url) {
    res.status(400).json({ error: "Type and URL are required" });
    return;
  }

  try {
    // Validate the type
    if (!['Concept Video', 'Question', 'Quiz', 'Practice Test'].includes(type)) {
      res.status(400).json({ error: "Type must be one of: 'Concept Video', 'Question', 'Quiz', 'Practice Test'" });
      return;
    }

    await db.run(
      "UPDATE resources SET title = ?, type = ?, url = ?, description = ? WHERE id = ?",
      [title, type, url, description, id]
    );
    const resource = await db.get("SELECT * FROM resources WHERE id = ?", id);
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }
    res.json(resource);
  } catch (error) {
    console.error("Error updating resource:", error);
    res.status(500).json({ error: "Failed to update resource" });
  }
});

app.delete("/api/resources/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    // Check if resource is being used by any lesson sections
    const sectionsUsingResource = await db.get("SELECT COUNT(*) as count FROM section_resources WHERE resource_id = ?", id);

    if (sectionsUsingResource.count > 0) {
      res.status(400).json({ error: "Cannot delete resource as it is being used in lesson sections" });
      return;
    }

    await db.run("DELETE FROM resources WHERE id = ?", id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

// Section Resources endpoints (many-to-many relationship)
app.get("/api/lesson-sections/:id/resources", async (req: Request, res: Response) => {
  try {
    const lessonSection = await db.get("SELECT * FROM lesson_sections WHERE id = ?", req.params.id);
    if (!lessonSection) {
      res.status(404).json({ error: "Lesson section not found" });
      return;
    }

    const resources = await db.all(`
      SELECT r.* FROM resources r
      JOIN section_resources sr ON r.id = sr.resource_id
      WHERE sr.section_id = ?
    `, req.params.id);
    res.json(resources);
  } catch (error) {
    console.error("Error fetching section resources:", error);
    res.status(500).json({ error: "Failed to fetch section resources" });
  }
});

app.post("/api/lesson-sections/:id/resources", async (req: Request, res: Response) => {
  const { resource_id } = req.body;
  const section_id = req.params.id;

  if (!resource_id) {
    res.status(400).json({ error: "Resource ID is required" });
    return;
  }

  try {
    // Verify both entities exist
    const sectionExists = await db.get("SELECT id FROM lesson_sections WHERE id = ?", section_id);
    if (!sectionExists) {
      res.status(404).json({ error: "Lesson section not found" });
      return;
    }

    const resourceExists = await db.get("SELECT id FROM resources WHERE id = ?", resource_id);
    if (!resourceExists) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }

    // Check if already exists
    const existingRelation = await db.get("SELECT * FROM section_resources WHERE section_id = ? AND resource_id = ?", [section_id, resource_id]);
    if (existingRelation) {
      res.status(400).json({ error: "This section already has this resource" });
      return;
    }

    await db.run("INSERT INTO section_resources (section_id, resource_id) VALUES (?, ?)", [section_id, resource_id]);
    res.status(201).json({ section_id, resource_id });
  } catch (error) {
    console.error("Error adding resource to section:", error);
    res.status(500).json({ error: "Failed to add resource to section" });
  }
});

app.delete("/api/lesson-sections/:id/resources/:resourceId", async (req: Request, res: Response) => {
  const section_id = req.params.id;
  const resource_id = req.params.resourceId;

  try {
    const result = await db.run("DELETE FROM section_resources WHERE section_id = ? AND resource_id = ?", [section_id, resource_id]);

    if (result.changes === 0) {
      res.status(404).json({ error: "Resource not found in this section" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error removing resource from section:", error);
    res.status(500).json({ error: "Failed to remove resource from section" });
  }
});

// Learning Level endpoints
app.get("/api/learning-levels", async (req: Request, res: Response) => {
  try {
    const learningLevels = await db.all("SELECT * FROM learning_levels");
    res.json(learningLevels);
  } catch (error) {
    console.error("Error fetching learning levels:", error);
    res.status(500).json({ error: "Failed to fetch learning levels" });
  }
});

app.get("/api/learning-levels/:id", async (req: Request, res: Response) => {
  try {
    const learningLevel = await db.get("SELECT * FROM learning_levels WHERE id = ?", req.params.id);
    if (!learningLevel) {
      res.status(404).json({ error: "Learning level not found" });
      return;
    }
    res.json(learningLevel);
  } catch (error) {
    console.error("Error fetching learning level:", error);
    res.status(500).json({ error: "Failed to fetch learning level" });
  }
});

app.get("/api/children/:id/learning-levels", async (req: Request, res: Response) => {
  try {
    const child = await db.get("SELECT * FROM children WHERE id = ?", req.params.id);
    if (!child) {
      res.status(404).json({ error: "Child not found" });
      return;
    }

    const learningLevels = await db.all("SELECT * FROM learning_levels WHERE child_id = ?", req.params.id);
    res.json(learningLevels);
  } catch (error) {
    console.error("Error fetching child's learning levels:", error);
    res.status(500).json({ error: "Failed to fetch child's learning levels" });
  }
});

app.get("/api/learning-indicators/:id/learning-levels", async (req: Request, res: Response) => {
  try {
    const learningIndicator = await db.get("SELECT * FROM learning_indicators WHERE id = ?", req.params.id);
    if (!learningIndicator) {
      res.status(404).json({ error: "Learning indicator not found" });
      return;
    }

    const learningLevels = await db.all("SELECT * FROM learning_levels WHERE learning_indicator_id = ?", req.params.id);
    res.json(learningLevels);
  } catch (error) {
    console.error("Error fetching learning indicator's learning levels:", error);
    res.status(500).json({ error: "Failed to fetch learning indicator's learning levels" });
  }
});

// For backward compatibility, also provide learning levels by topic through learning indicators
app.get("/api/topics/:id/learning-levels", async (req: Request, res: Response) => {
  try {
    const topic = await db.get("SELECT * FROM topics WHERE id = ?", req.params.id);
    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    // Get learning indicators for this topic
    const learningIndicators = await db.all("SELECT * FROM learning_indicators WHERE topic_id = ?", req.params.id);
    
    // Get learning levels for all these learning indicators
    const learningLevels = [];
    for (const indicator of learningIndicators) {
      const levels = await db.all("SELECT * FROM learning_levels WHERE learning_indicator_id = ?", indicator.id);
      learningLevels.push(...levels);
    }
    
    res.json(learningLevels);
  } catch (error) {
    console.error("Error fetching topic's learning levels:", error);
    res.status(500).json({ error: "Failed to fetch topic's learning levels" });
  }
});

app.get("/api/children/:childId/learning-indicators/:indicatorId/learning-level", async (req: Request, res: Response) => {
  const { childId, indicatorId } = req.params;

  try {
    const learningLevel = await db.get("SELECT * FROM learning_levels WHERE child_id = ? AND learning_indicator_id = ?", [childId, indicatorId]);
    if (!learningLevel) {
      res.status(404).json({ error: "Learning level not found for this child and learning indicator" });
      return;
    }
    res.json(learningLevel);
  } catch (error) {
    console.error("Error fetching specific learning level:", error);
    res.status(500).json({ error: "Failed to fetch specific learning level" });
  }
});

// For backward compatibility
app.get("/api/children/:childId/topics/:topicId/learning-level", async (req: Request, res: Response) => {
  const { childId, topicId } = req.params;

  try {
    // Find learning indicators for this topic
    const learningIndicators = await db.all("SELECT * FROM learning_indicators WHERE topic_id = ?", topicId);
    if (learningIndicators.length === 0) {
      res.status(404).json({ error: "No learning indicators found for this topic" });
      return;
    }
    
    // Find learning levels for this child and any of these learning indicators
    const learningLevels = [];
    for (const indicator of learningIndicators) {
      const level = await db.get("SELECT * FROM learning_levels WHERE child_id = ? AND learning_indicator_id = ?", [childId, indicator.id]);
      if (level) {
        learningLevels.push(level);
      }
    }
    
    if (learningLevels.length === 0) {
      res.status(404).json({ error: "Learning level not found for this child and topic" });
      return;
    }
    
    // Return the first one for backward compatibility
    res.json(learningLevels[0]);
  } catch (error) {
    console.error("Error fetching specific learning level:", error);
    res.status(500).json({ error: "Failed to fetch specific learning level" });
  }
});

app.post("/api/learning-levels", async (req: Request, res: Response) => {
  const { child_id, learning_indicator_id, level, state, do_not_understand, what_next } = req.body;
  const last_evaluated_on = req.body.last_evaluated_on || new Date().toISOString();

  if (!child_id || !learning_indicator_id || !level) {
    res.status(400).json({ error: "Child ID, learning indicator ID, and level are required" });
    return;
  }

  try {
    // Verify that the child_id and learning_indicator_id exist
    const childExists = await db.get("SELECT id FROM children WHERE id = ?", child_id);
    if (!childExists) {
      res.status(400).json({ error: "Invalid child_id" });
      return;
    }

    const indicatorExists = await db.get("SELECT id FROM learning_indicators WHERE id = ?", learning_indicator_id);
    if (!indicatorExists) {
      res.status(400).json({ error: "Invalid learning_indicator_id" });
      return;
    }

    // Validate the level
    if (!['Weak', 'Average', 'Strong'].includes(level)) {
      res.status(400).json({ error: "Level must be one of: 'Weak', 'Average', 'Strong'" });
      return;
    }
    
    // Validate the state if provided
    if (state && !['assess', 'teach', 'taught', null].includes(state)) {
      res.status(400).json({ error: "State must be one of: 'assess', 'teach', 'taught', or null" });
      return;
    }

    // Check if already exists
    const existingLevel = await db.get("SELECT id FROM learning_levels WHERE child_id = ? AND learning_indicator_id = ?", [child_id, learning_indicator_id]);
    if (existingLevel) {
      res.status(400).json({ error: "A learning level already exists for this child and learning indicator. Use PUT to update it." });
      return;
    }

    const result = await db.run(
      "INSERT INTO learning_levels (child_id, learning_indicator_id, level, state, do_not_understand, what_next, last_evaluated_on) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [child_id, learning_indicator_id, level, state, do_not_understand, what_next, last_evaluated_on]
    );
    const id = result.lastID;
    const learningLevel = await db.get("SELECT * FROM learning_levels WHERE id = ?", id);
    res.status(201).json(learningLevel);
  } catch (error) {
    console.error("Error creating learning level:", error);
    res.status(500).json({ error: "Failed to create learning level" });
  }
});

app.put("/api/learning-levels/:id", async (req: Request, res: Response) => {
  const { child_id, learning_indicator_id, level, state, do_not_understand, what_next } = req.body;
  const last_evaluated_on = req.body.last_evaluated_on || new Date().toISOString();
  const id = req.params.id;

  if (!child_id || !learning_indicator_id || !level) {
    res.status(400).json({ error: "Child ID, learning indicator ID, and level are required" });
    return;
  }

  try {
    // Verify that the child_id and learning_indicator_id exist
    const childExists = await db.get("SELECT id FROM children WHERE id = ?", child_id);
    if (!childExists) {
      res.status(400).json({ error: "Invalid child_id" });
      return;
    }

    const indicatorExists = await db.get("SELECT id FROM learning_indicators WHERE id = ?", learning_indicator_id);
    if (!indicatorExists) {
      res.status(400).json({ error: "Invalid learning_indicator_id" });
      return;
    }

    // Validate the level
    if (!['Weak', 'Average', 'Strong'].includes(level)) {
      res.status(400).json({ error: "Level must be one of: 'Weak', 'Average', 'Strong'" });
      return;
    }
    
    // Validate the state if provided
    if (state && !['assess', 'teach', 'taught', null].includes(state)) {
      res.status(400).json({ error: "State must be one of: 'assess', 'teach', 'taught', or null" });
      return;
    }

    await db.run(
      "UPDATE learning_levels SET child_id = ?, learning_indicator_id = ?, level = ?, state = ?, do_not_understand = ?, what_next = ?, last_evaluated_on = ? WHERE id = ?",
      [child_id, learning_indicator_id, level, state, do_not_understand, what_next, last_evaluated_on, id]
    );
    const learningLevel = await db.get("SELECT * FROM learning_levels WHERE id = ?", id);
    if (!learningLevel) {
      res.status(404).json({ error: "Learning level not found" });
      return;
    }
    res.json(learningLevel);
  } catch (error) {
    console.error("Error updating learning level:", error);
    res.status(500).json({ error: "Failed to update learning level" });
  }
});

app.delete("/api/learning-levels/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    await db.run("DELETE FROM learning_levels WHERE id = ?", id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting learning level:", error);
    res.status(500).json({ error: "Failed to delete learning level" });
  }
});

// Many-to-Many relationship endpoints for Child-Subject enrollments
app.get("/api/children/:id/subjects", async (req: Request, res: Response) => {
  try {
    const child = await db.get("SELECT * FROM children WHERE id = ?", req.params.id);
    if (!child) {
      res.status(404).json({ error: "Child not found" });
      return;
    }

    // Get the child's grade first
    const childWithGrade = await db.get(`
      SELECT c.*, g.id as grade_id, g.name as grade_name 
      FROM children c
      JOIN grades g ON c.grade_id = g.id
      WHERE c.id = ?
    `, req.params.id);
    
    if (!childWithGrade.grade_id) {
      res.status(400).json({ error: "Child does not have an assigned grade" });
      return;
    }
    
    // Get subjects for the child's grade
    const subjects = await db.all(`
      SELECT s.* FROM subjects s
      WHERE s.grade_id = ?
    `, childWithGrade.grade_id);
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching child's subjects:", error);
    res.status(500).json({ error: "Failed to fetch child's subjects" });
  }
});

app.post("/api/children/:id/subjects", async (req: Request, res: Response) => {
  const { subject_id } = req.body;
  const child_id = req.params.id;

  if (!subject_id) {
    res.status(400).json({ error: "Subject ID is required" });
    return;
  }

  try {
    // Verify both entities exist
    const childExists = await db.get("SELECT id FROM children WHERE id = ?", child_id);
    if (!childExists) {
      res.status(404).json({ error: "Child not found" });
      return;
    }

    const subjectExists = await db.get("SELECT id FROM subjects WHERE id = ?", subject_id);
    if (!subjectExists) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    // Check if already exists
    const existingEnrollment = await db.get("SELECT * FROM child_subjects WHERE child_id = ? AND subject_id = ?", [child_id, subject_id]);
    if (existingEnrollment) {
      res.status(400).json({ error: "Child is already enrolled in this subject" });
      return;
    }

    await db.run("INSERT INTO child_subjects (child_id, subject_id) VALUES (?, ?)", [child_id, subject_id]);
    res.status(201).json({ child_id, subject_id });
  } catch (error) {
    console.error("Error enrolling child in subject:", error);
    res.status(500).json({ error: "Failed to enroll child in subject" });
  }
});

app.delete("/api/children/:id/subjects/:subjectId", async (req: Request, res: Response) => {
  const child_id = req.params.id;
  const subject_id = req.params.subjectId;

  try {
    const result = await db.run("DELETE FROM child_subjects WHERE child_id = ? AND subject_id = ?", [child_id, subject_id]);

    if (result.changes === 0) {
      res.status(404).json({ error: "Child is not enrolled in this subject" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error removing child from subject:", error);
    res.status(500).json({ error: "Failed to remove child from subject" });
  }
});

// Many-to-Many relationship endpoints for Teacher-Subject assignments
app.get("/api/teachers/:id/subjects", async (req: Request, res: Response) => {
  try {
    const teacher = await db.get("SELECT * FROM teachers WHERE id = ?", req.params.id);
    if (!teacher) {
      res.status(404).json({ error: "Teacher not found" });
      return;
    }

    const subjects = await db.all(`
      SELECT s.* FROM subjects s
      JOIN teacher_subjects ts ON s.id = ts.subject_id
      WHERE ts.teacher_id = ?
    `, req.params.id);
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching teacher's subjects:", error);
    res.status(500).json({ error: "Failed to fetch teacher's subjects" });
  }
});

app.post("/api/teachers/:id/subjects", async (req: Request, res: Response) => {
  const { subject_id } = req.body;
  const teacher_id = req.params.id;

  if (!subject_id) {
    res.status(400).json({ error: "Subject ID is required" });
    return;
  }

  try {
    // Verify both entities exist
    const teacherExists = await db.get("SELECT id FROM teachers WHERE id = ?", teacher_id);
    if (!teacherExists) {
      res.status(404).json({ error: "Teacher not found" });
      return;
    }

    const subjectExists = await db.get("SELECT id FROM subjects WHERE id = ?", subject_id);
    if (!subjectExists) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    // Check if already exists
    const existingAssignment = await db.get("SELECT * FROM teacher_subjects WHERE teacher_id = ? AND subject_id = ?", [teacher_id, subject_id]);
    if (existingAssignment) {
      res.status(400).json({ error: "Teacher is already assigned to this subject" });
      return;
    }

    await db.run("INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)", [teacher_id, subject_id]);
    res.status(201).json({ teacher_id, subject_id });
  } catch (error) {
    console.error("Error assigning teacher to subject:", error);
    res.status(500).json({ error: "Failed to assign teacher to subject" });
  }
});

app.delete("/api/teachers/:id/subjects/:subjectId", async (req: Request, res: Response) => {
  const teacher_id = req.params.id;
  const subject_id = req.params.subjectId;

  try {
    const result = await db.run("DELETE FROM teacher_subjects WHERE teacher_id = ? AND subject_id = ?", [teacher_id, subject_id]);

    if (result.changes === 0) {
      res.status(404).json({ error: "Teacher is not assigned to this subject" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error updating learning indicator:", error);
    res.status(500).json({ error: "Failed to update learning indicator" });
  }
});

// GET all learning indicators
app.get("/api/learning-indicators", async (req: Request, res: Response) => {
  try {
    const learningIndicators = await db.all(`
      SELECT li.*, c.name as chapter_name, c.id as chapter_id
      FROM learning_indicators li
      LEFT JOIN topic_chapter_mapping tcm ON li.topic_chapter_mapping_id = tcm.id
      LEFT JOIN chapters c ON tcm.chapter_id = c.id
    `);
    res.json(learningIndicators);
  } catch (error) {
    console.error("Error fetching learning indicators:", error);
    res.status(500).json({ error: "Failed to fetch learning indicators" });
  }
});

// GET a specific learning indicator
app.get("/api/learning-indicators/:id", async (req: Request, res: Response) => {
  try {
    const learningIndicator = await db.get("SELECT * FROM learning_indicators WHERE id = ?", req.params.id);
    if (!learningIndicator) {
      res.status(404).json({ error: "Learning indicator not found" });
      return;
    }
    res.json(learningIndicator);
  } catch (error) {
    console.error("Error fetching learning indicator:", error);
    res.status(500).json({ error: "Failed to fetch learning indicator" });
  }
});

// POST create a new learning indicator
app.post("/api/learning-indicators", async (req: Request, res: Response) => {
  const { title, topic_id, topic_chapter_mapping_id, common_misconception } = req.body;

  if (!title || !topic_id) {
    res.status(400).json({ error: "Title and topic ID are required" });
    return;
  }

  try {
    // Check if topic exists
    const topic = await db.get("SELECT * FROM topics WHERE id = ?", topic_id);
    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    // If topic_chapter_mapping_id is provided, verify it exists and belongs to the topic
    if (topic_chapter_mapping_id) {
      const mapping = await db.get(
        "SELECT * FROM topic_chapter_mapping WHERE id = ? AND topic_id = ?",
        [topic_chapter_mapping_id, topic_id]
      );
      if (!mapping) {
        res.status(400).json({ error: "Invalid topic_chapter_mapping_id or it doesn't belong to the specified topic" });
        return;
      }
    }

    const result = await db.run(
      "INSERT INTO learning_indicators (title, topic_id, topic_chapter_mapping_id, common_misconception) VALUES (?, ?, ?, ?)",
      [title, topic_id, topic_chapter_mapping_id || null, common_misconception || null]
    );

    const newLearningIndicator = {
      id: result.lastID,
      title,
      topic_id,
      topic_chapter_mapping_id: topic_chapter_mapping_id || null,
      common_misconception
    };

    res.status(201).json(newLearningIndicator);
  } catch (error) {
    console.error("Error creating learning indicator:", error);
    res.status(500).json({ error: "Failed to create learning indicator" });
  }
});

// PUT update a learning indicator
app.put("/api/learning-indicators/:id", async (req: Request, res: Response) => {
  const { title, topic_id, topic_chapter_mapping_id, common_misconception } = req.body;
  const id = req.params.id;

  if (!title || !topic_id) {
    res.status(400).json({ error: "Title and topic ID are required" });
    return;
  }

  try {
    // Check if learning indicator exists
    const learningIndicator = await db.get("SELECT * FROM learning_indicators WHERE id = ?", id);
    if (!learningIndicator) {
      res.status(404).json({ error: "Learning indicator not found" });
      return;
    }

    // Check if topic exists
    const topic = await db.get("SELECT * FROM topics WHERE id = ?", topic_id);
    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    // If topic_chapter_mapping_id is provided, verify it exists and belongs to the topic
    if (topic_chapter_mapping_id) {
      const mapping = await db.get(
        "SELECT * FROM topic_chapter_mapping WHERE id = ? AND topic_id = ?",
        [topic_chapter_mapping_id, topic_id]
      );
      if (!mapping) {
        res.status(400).json({ error: "Invalid topic_chapter_mapping_id or it doesn't belong to the specified topic" });
        return;
      }
    }

    await db.run(
      "UPDATE learning_indicators SET title = ?, topic_id = ?, topic_chapter_mapping_id = ?, common_misconception = ? WHERE id = ?",
      [title, topic_id, topic_chapter_mapping_id || null, common_misconception || null, id]
    );

    const updatedLearningIndicator = {
      id: Number(id),
      title,
      topic_id,
      topic_chapter_mapping_id: topic_chapter_mapping_id || null,
      common_misconception
    };

    res.json(updatedLearningIndicator);
  } catch (error) {
    console.error("Error updating learning indicator:", error);
    res.status(500).json({ error: "Failed to update learning indicator" });
  }
});

app.delete("/api/learning-indicators/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    // Check if learning indicator exists
    const learningIndicator = await db.get("SELECT * FROM learning_indicators WHERE id = ?", id);
    if (!learningIndicator) {
      res.status(404).json({ error: "Learning indicator not found" });
      return;
    }

    // Delete associated resource relationships first
    await db.run("DELETE FROM learning_indicator_resources WHERE learning_indicator_id = ?", id);
    
    // Delete the learning indicator
    await db.run("DELETE FROM learning_indicators WHERE id = ?", id);

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting learning indicator:", error);
    res.status(500).json({ error: "Failed to delete learning indicator" });
  }
});

// Learning Indicator Resources API
app.get("/api/learning-indicators/:id/resources", async (req: Request, res: Response) => {
  try {
    const resources = await db.all(
      `SELECT r.* FROM resources r 
       JOIN learning_indicator_resources lir ON r.id = lir.resource_id 
       WHERE lir.learning_indicator_id = ?`,
      req.params.id
    );
    res.json(resources);
  } catch (error) {
    console.error("Error fetching learning indicator resources:", error);
    res.status(500).json({ error: "Failed to fetch learning indicator resources" });
  }
});

app.post("/api/learning-indicators/:id/resources", async (req: Request, res: Response) => {
  const { resource_id } = req.body;
  const learning_indicator_id = req.params.id;

  if (!resource_id) {
    res.status(400).json({ error: "Resource ID is required" });
    return;
  }

  try {
    // Check if learning indicator exists
    const learningIndicator = await db.get("SELECT * FROM learning_indicators WHERE id = ?", learning_indicator_id);
    if (!learningIndicator) {
      res.status(404).json({ error: "Learning indicator not found" });
      return;
    }

    // Check if resource exists
    const resource = await db.get("SELECT * FROM resources WHERE id = ?", resource_id);
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }

    // Check if relationship already exists
    const existingRelationship = await db.get(
      "SELECT * FROM learning_indicator_resources WHERE learning_indicator_id = ? AND resource_id = ?",
      [learning_indicator_id, resource_id]
    );

    if (existingRelationship) {
      res.status(409).json({ error: "Resource is already associated with this learning indicator" });
      return;
    }

    await db.run(
      "INSERT INTO learning_indicator_resources (learning_indicator_id, resource_id) VALUES (?, ?)",
      [learning_indicator_id, resource_id]
    );

    res.status(201).json({ learning_indicator_id: Number(learning_indicator_id), resource_id: Number(resource_id) });
  } catch (error) {
    console.error("Error adding resource to learning indicator:", error);
    res.status(500).json({ error: "Failed to add resource to learning indicator" });
  }
});

app.delete("/api/learning-indicators/:id/resources/:resourceId", async (req: Request, res: Response) => {
  const learning_indicator_id = req.params.id;
  const resource_id = req.params.resourceId;

  try {
    // Check if relationship exists
    const relationship = await db.get(
      "SELECT * FROM learning_indicator_resources WHERE learning_indicator_id = ? AND resource_id = ?",
      [learning_indicator_id, resource_id]
    );

    if (!relationship) {
      res.status(404).json({ error: "Resource is not associated with this learning indicator" });
      return;
    }

    await db.run(
      "DELETE FROM learning_indicator_resources WHERE learning_indicator_id = ? AND resource_id = ?",
      [learning_indicator_id, resource_id]
    );

    res.status(204).send();
  } catch (error) {
    console.error("Error removing resource from learning indicator:", error);
    res.status(500).json({ error: "Failed to remove resource from learning indicator" });
  }
});

// Get learning indicators by learning outcome
app.get("/api/lesson-plans/:id/learning-indicators", async (req: Request, res: Response) => {
  try {
    const learningIndicators = await db.all(
      "SELECT * FROM learning_indicators WHERE learning_outcome_id = ?",
      req.params.id
    );
    res.json(learningIndicators);
  } catch (error) {
    console.error("Error fetching learning indicators for learning outcome:", error);
    res.status(500).json({ error: "Failed to fetch learning indicators for learning outcome" });
  }
});

// Get learning indicators by topic
app.get("/api/topics/:id/learning-indicators", async (req: Request, res: Response) => {
  try {
    const learningIndicators = await db.all(
      "SELECT * FROM learning_indicators WHERE topic_id = ?",
      req.params.id
    );
    res.json(learningIndicators);
  } catch (error) {
    console.error("Error fetching learning indicators for topic:", error);
    res.status(500).json({ error: "Failed to fetch learning indicators for topic" });
  }
});

// Learning progression controller will be initialized after database setup
let learningProgressionController: LearningProgressionController;

// GET a child's learning progression across a chapter
app.get("/api/children/:childId/chapters/:chapterId/learning-progression", (req, res) => {
  learningProgressionController.getLearningProgression(req, res);
});

// Start the admin API server
const PORT = process.env.ADMIN_SERVER_PORT || 8001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;