import * as dotenv from "dotenv";
import * as http from "http";
import { WebSocketServer } from "ws";
import OpenAI from "openai";
import * as yaml from "js-yaml";
import ConversationManager from "./ConversationManager";
import { loadTeacherPersona } from "./TeacherPersonaLoader";
import { loadBookFeatures } from "./PedagogicalKnowledgeLoader";
import { ChatCompletionMessageParam } from "openai/resources/chat";

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
  bookFeatures
    .reduce((acc, { feature, subject }) => {
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

// Function to parse response into standardized format
function parseResponse(text: string): {
  type: string;
  text?: string;
  action?: string;
} {
  console.log(`got gpt response as: ${text}`);
  let yamlText = text;

  // Check if response contains YAML markdown wrappers
  const hasYamlMarkers = /```yaml\n([\s\S]*?)\n```/.test(text);

  if (hasYamlMarkers) {
    // Extract text between ```yaml and ```
    const match = text.match(/```yaml\n([\s\S]*?)\n```/);
    yamlText = match ? match[1] : text;
  }

  // Try to parse as YAML and convert to JSON
  try {
    const parsed = yaml.load(yamlText) as {
      type?: string;
      text?: string;
      action?: string;
    };
    return {
      type: parsed.type || "text",
      text: parsed.text || yamlText,
      action: parsed.action,
    };
  } catch (e) {
    // If YAML parsing fails, return default structure with full text as response
    return {
      type: "text",
      text: yamlText,
    };
  }
}

wss.on("connection", (ws) => {
  let currentSessionId: string | null = null;

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "session") {
        currentSessionId = data.sessionId;
        // Create new session with grade and book information
        conversationManager.createSession(
          data.sessionId,
          data.grade,
          data.bookIds
        );

        // Generate and set system prompt for the session
        const systemPrompt = await generateSystemPrompt(data.sessionId);
        conversationManager.setSystemPrompt(data.sessionId, systemPrompt);

        console.log(
          `Created session ${data.sessionId} for grade "${data.grade}" child and bookIds ${data.bookIds}`
        );
        console.log(`System prompt: ${systemPrompt}`);

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

        const messages: ChatCompletionMessageParam[] = [
          { role: "system", content: session.systemPrompt },
        ];

        if (data.type === "message") {
          // Handle text message
          messages.push({
            role: "user",
            content: data.text,
          });
        } else if (data.type === "photo") {
          // Handle photo message
          messages.push({
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: data.data,
                } as { url: string },
              },
              {
                type: "text",
                text: "Please analyze this photo",
              },
            ] as any,
          });
        }

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          temperature: 0.7,
        });

        const aiResponse = response.choices[0].message.content ?? "";

        // Parse the AI response into the specified format
        const parsedResponse = parseResponse(aiResponse);

        // Send parsed response as JSON
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
