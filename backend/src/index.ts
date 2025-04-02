import * as dotenv from "dotenv";
import * as http from "http";
import { WebSocketServer } from "ws";
import OpenAI from "openai";
import ConversationManager from "./ConversationManager";
import { loadTeacherPersona } from "./TeacherPersonaLoader";
import { loadBookFeatures } from "./PedagogicalKnowledgeLoader";
import { loadPedagogicalKnowledgeForBookFeature } from "./PedagogicalKnowledgeLoader";
import { ChatCompletionMessageParam } from "openai/resources/chat";
import parseResponse from "./utils/parseResponse";

dotenv.config();

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server");
});

const wss = new WebSocketServer({ server });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const conversationManager = ConversationManager.getInstance();

async function generateSystemPrompt(sessionId: string): Promise<string> {
  const session = conversationManager.getSession(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const teacherPersona = await loadTeacherPersona(sessionId);

  // Get all book features for the session's books
  const bookFeatures = await loadBookFeatures(sessionId);
  console.log(`Book features for session ${sessionId}:`, bookFeatures);

  // Create the system prompt
  const systemPrompt = `You are a friendly and helpful AI tutor for ${
    session.grade
  } children.

${teacherPersona}

You will teach the following book features:
${Object.entries(
  bookFeatures.reduce((acc, { feature, subject }) => {
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(feature);
    return acc;
  }, {} as Record<string, string[]>)
)
  .map(([subject, features]) => `${subject}\n - ${features.join("\n - ")}`)
  .join("\n\n")}

As a child shares what they want to learn, use the appropriate teaching methodology for that feature.

Reply format
---
You should reply back in YAML format only and nothing else. Replies can be of below types:

- Text reply
---
type: text
text: Hello

- Take photo
---
type: action
action: take_photo
text: Take a photo of speaking corner`;

  return systemPrompt;
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

        const systemPrompt = await generateSystemPrompt(data.sessionId);
        conversationManager.setSystemPrompt(data.sessionId, systemPrompt);

        console.log(
          `Created session ${data.sessionId} for grade "${data.grade}" child and bookIds ${data.bookIds}`
        );
        return;
      }

      if (
        currentSessionId &&
        (data.type === "message" || data.type === "photo")
      ) {
        const session = conversationManager.getSession(currentSessionId);
        if (!session || !session.systemPrompt) {
          throw new Error("Session not initialized properly");
        }

        // Get existing messages and start with system prompt
        const messages: ChatCompletionMessageParam[] = [
          { role: "system", content: session.systemPrompt },
          ...session.messages, // Include conversation history
        ];

        // Create new message based on input type
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

        // Add new message to history
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
                      enum: ["Speaking corner"],
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

        // Handle tool calls
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
                  args.bookFeature
                );

              messages.push(response.choices[0].message);
              messages.push({
                role: "tool",
                content: pedagogicalKnowledge,
                tool_call_id: toolCall.id,
              });

              const followUpResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages,
                temperature: 0.7,
              });

              aiResponse = followUpResponse.choices[0].message.content ?? "";
            }
          }
        }

        // Add AI response to conversation history
        const assistantMessage: ChatCompletionMessageParam = {
          role: "assistant",
          content: aiResponse,
        };
        conversationManager.appendMessage(currentSessionId, assistantMessage);

        const parsedResponse = parseResponse(aiResponse);

        ws.send(
          JSON.stringify({
            type: parsedResponse.type,
            text: parsedResponse.text,
            action: parsedResponse.action,
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
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
