import * as dotenv from "dotenv";
dotenv.config();

import * as http from "http";
import { WebSocketServer } from "ws";
import OpenAI from "openai";
import ConversationManager from "./ConversationManager";
import { loadPedagogicalKnowledgeForBookFeature } from "./PedagogicalKnowledgeLoader";
import { ChatCompletionMessageParam } from "openai/resources/chat";
import parseResponse from "./utils/parseResponse";
import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";
import { generateAudio } from "./utils/generateAudio";
import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_API_URL
});
const trace = langfuse.trace({
  name: "teacher@home",
});

// Database setup
let db: Database;

async function initializeDatabase() {
  db = await open({
    filename: process.env.DATABASE_FILEPATH || "./admin_database.sqlite",
    driver: sqlite3.Database,
  });

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
      FOREIGN KEY (grade_id) REFERENCES grades(id)
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

    CREATE TABLE IF NOT EXISTS lesson_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER,
      topic_id INTEGER,
      learning_objective TEXT NOT NULL,
      FOREIGN KEY (child_id) REFERENCES children(id),
      FOREIGN KEY (topic_id) REFERENCES topics(id)
    );

    CREATE TABLE IF NOT EXISTS lesson_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_plan_id INTEGER,
      type TEXT CHECK (type IN ('I Do', 'We Do', 'You Do')),
      teaching_pedagogy TEXT NOT NULL,
      FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id)
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK (type IN ('Concept Video', 'Question', 'Quiz', 'Practice Test')),
      url TEXT NOT NULL,
      metadata TEXT
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
      topic_id INTEGER,
      level TEXT CHECK (level IN ('Weak', 'Average', 'Strong')),
      do_not_understand TEXT,
      what_next TEXT,
      last_evaluated_on TEXT,
      FOREIGN KEY (child_id) REFERENCES children(id),
      FOREIGN KEY (topic_id) REFERENCES topics(id)
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

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server");
});

const wss = new WebSocketServer({ server });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const conversationManager = ConversationManager.getInstance();

wss.on("connection", (ws) => {
  let currentSessionId: string | null = null;

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "session") {
        currentSessionId = data.sessionId;
        conversationManager.createSession(
          data.sessionId,
          data.grade,
          data.bookIds
        );

        await conversationManager.getSession(data.sessionId)?.initialise(db);

        console.log(
          `Created session ${data.sessionId} for grade "${data.grade}" child and bookIds ${data.bookIds}`
        );
        ws.send(JSON.stringify({ type: "session-created", session: conversationManager.getSession(data.sessionId) }));
        return;
      }

      if (data.type === "generate-audio") {
        const audio = await generateAudio(data.text, 1, data.voiceName);
        ws.send(JSON.stringify({ type: "audio", audio }));
      }

      if (
        currentSessionId &&
        (data.type === "message" || data.type === "photo")
      ) {
        const session = conversationManager.getSession(currentSessionId);
        if (!session || !session.systemPrompt) {
          throw new Error("Session not initialized properly");
        }

        const messages: ChatCompletionMessageParam[] = [
          { role: "system", content: session.systemPrompt },
          ...(session.messages ?? []),
        ];

        let newMessage: ChatCompletionMessageParam;
        if (data.type === "message") {
          newMessage = {
            role: "user",
            content: data.text,
          };
        } else {
          newMessage = {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: data.data },
              },
              {
                type: "text",
                text: "Please analyze this photo",
              },
            ] as any,
          };
        }

        messages.push(newMessage);
        conversationManager.appendMessage(currentSessionId, newMessage);

        // const generation = trace.generation({
        //   name: "chat-completion",
        //   model: "gpt-4o",
        //   input: messages,
        // });

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          tools: [
            {
              type: "function",
              function: {
                name: "loadPedagogicalKnowledgeForBookFeature",
                description:
                  "Load pedagogical knowledge about how to teach a specific book feature",
                parameters: {
                  type: "object",
                  properties: {
                    bookFeature: {
                      type: "string",
                      description:
                        "The name of the book feature to get teaching methodology for",
                      enum: session.featureMap,
                    },
                  },
                  required: ["bookFeature"],
                },
              },
            },
          ],
          tool_choice: "auto",
        });

        // generation.end({
        //   output: response,
        // });

        let aiResponse = response.choices[0].message.content ?? "";

        if (response.choices[0].message.tool_calls) {
          for (const toolCall of response.choices[0].message.tool_calls) {
            if (
              toolCall.function.name ===
              "loadPedagogicalKnowledgeForBookFeature"
            ) {
              const args = JSON.parse(toolCall.function.arguments);
              const pedagogicalKnowledge =
                await loadPedagogicalKnowledgeForBookFeature(
                  currentSessionId,
                  args.bookFeature,
                  db
                );

              messages.push(response.choices[0].message);
              messages.push({
                role: "tool",
                content: pedagogicalKnowledge,
                tool_call_id: toolCall.id,
              });

              session.currentlyStudying(args.bookFeature)

              const followUpResponse = await openai.chat.completions.create({
                model: "gpt-4.1",
                messages,
                temperature: 0.7,
              });

              aiResponse = followUpResponse.choices[0].message.content ?? "";
            }
          }
        }

        const assistantMessage: ChatCompletionMessageParam = {
          role: "assistant",
          content: aiResponse,
        };
        conversationManager.appendMessage(currentSessionId, assistantMessage);

        const parsedResponse = parseResponse(aiResponse);
        console.log(parsedResponse)

        ws.send(
          JSON.stringify({
            type: parsedResponse.type,
            speak: parsedResponse.speak,
            write: parsedResponse.write,
            action: parsedResponse.action,
            audio: await generateAudio(parsedResponse.speak || "")
          })
        );
      }
    } catch (error) {
      console.error("Error:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "An error occurred while processing your request.",
        })
      );
    }
  });
});

const PORT = 8000;
async function startServer() {
  await initializeDatabase();
  server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
}

startServer().catch(console.error);