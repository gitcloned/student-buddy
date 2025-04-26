import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";
import dotenv from "dotenv";

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

  await db.exec(`
    CREATE TABLE IF NOT EXISTS teacher_personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade TEXT NOT NULL,
      persona TEXT NOT NULL,
      language TEXT NOT NULL,
      tone TEXT NOT NULL,
      motivation TEXT NOT NULL,
      humor TEXT NOT NULL
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

initializeDatabase().catch(console.error);

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
  const { grade, persona, language, tone, motivation, humor } = req.body;

  if (!grade || !persona || !language || !tone || !motivation || !humor) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const result = await db.run(
      "INSERT INTO teacher_personas (grade, persona, language, tone, motivation, humor) VALUES (?, ?, ?, ?, ?, ?)",
      grade,
      persona,
      language,
      tone,
      motivation,
      humor
    );
    const newPersona = await db.get(
      "SELECT * FROM teacher_personas WHERE id = ?",
      result.lastID
    );
    res.status(201).json(newPersona);
  } catch (error) {
    console.error("Error creating persona:", error);
    res.status(500).json({ error: "Failed to create persona" });
  }
});

// PUT update an existing teacher persona
app.put("/api/personas/:id", async (req: Request, res: Response) => {
  const { grade, persona, language, tone, motivation, humor } = req.body;

  if (!grade || !persona || !language || !tone || !motivation || !humor) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    await db.run(
      "UPDATE teacher_personas SET grade = ?, persona = ?, language = ?, tone = ?, motivation = ?, humor = ? WHERE id = ?",
      grade,
      persona,
      language,
      tone,
      motivation,
      humor,
      req.params.id
    );
    const updatedPersona = await db.get("SELECT * FROM teacher_personas WHERE id = ?", req.params.id);
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

// Start the admin API server
const PORT = process.env.ADMIN_SERVER_PORT || 8001;
app.listen(PORT, () => {
  console.log(`Admin API server is running on port ${PORT}`);
});

export default app;