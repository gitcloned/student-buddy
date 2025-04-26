import * as dotenv from "dotenv";
import * as http from "http";
import { WebSocketServer } from "ws";
import OpenAI from "openai";
import ConversationManager from "./ConversationManager";
import { loadTeacherPersona } from "./TeacherPersonaLoader";
import { loadBookFeatures, loadPedagogicalKnowledgeForBookFeature } from "./PedagogicalKnowledgeLoader";
import { ChatCompletionMessageParam } from "openai/resources/chat";
import parseResponse from "./utils/parseResponse";
import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";
import { generateAudio } from "./utils/generateAudio";
import { TeacherPersona } from "./types";

dotenv.config();

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
      persona TEXT NOT NULL
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

async function fetchSessionRelatedSettings(sessionId: string): Promise<{ systemPrompt: string; featureMap: string[]; teacherPersona: TeacherPersona }> {
  const session = conversationManager.getSession(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const { persona, language, tone, motivation, humor } = await loadTeacherPersona(sessionId, db);
  const bookFeatures = await loadBookFeatures(sessionId, db);

  const featureMap = [...new Set(bookFeatures.map(f => f.feature))];

  const systemPrompt = `You are a friendly and helpful AI tutor for ${session.grade
    } children.

${persona}

You will teach the following book features, for which child will share the image from a book:
${Object.entries(
      bookFeatures.reduce((acc, { feature, subject }) => {
        if (!acc[subject]) acc[subject] = [];
        acc[subject].push(feature);
        return acc;
      }, {} as Record<string, string[]>)
    )
      .map(([subject, features]) => `${subject}\n - ${features.join("\n - ")}`)
      .join("\n\n")}

As a child shares what they want to learn, fetch the appropriate teaching methodology for that feature.

Reply format
---
You should reply back in YAML format only and nothing else. YAML reply can contain below attributes:

type: what type of reply this is, text, action
text: text to speak
action: action to perform
write: what teacher should draw on blackboard

Replies can be of below types:

- Text reply
---
type: text
text: Solve 5x + 4 = 12
write: 5x + 4 = 12

- Take photo
---
type: action
action: take_photo
text: Take a photo of speaking corner
write: 
`;

  return {
    systemPrompt, featureMap, teacherPersona: {
      persona,
      language,
      tone,
      motivation,
      humor,
      grade: session.grade
    }
  };
}

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

        const { systemPrompt, featureMap, teacherPersona } = await fetchSessionRelatedSettings(data.sessionId);
        conversationManager.setSystemPrompt(data.sessionId, systemPrompt);
        conversationManager.setFeatureMap(data.sessionId, featureMap);
        conversationManager.setTeacherPersona(data.sessionId, teacherPersona);

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
          ...session.messages,
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
            text: parsedResponse.text,
            write: parsedResponse.write,
            action: parsedResponse.action,
            audio: await generateAudio(parsedResponse.text || "")
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