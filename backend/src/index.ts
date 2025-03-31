import * as dotenv from "dotenv";
import * as http from "http";
import { WebSocketServer } from "ws";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./prompt";
import * as yaml from "js-yaml";

dotenv.config();

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server");
});

const wss = new WebSocketServer({ server });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store conversations by session ID
const conversations = new Map();

// Function to parse response into standardized format
function parseResponse(text: string): { type: string; response: string } {
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
    const parsed = yaml.load(yamlText) as { type?: string; response?: string };
    return {
      type: parsed.type || "text",
      response: parsed.response || yamlText,
    };
  } catch (e) {
    // If YAML parsing fails, return default structure with full text as response
    return {
      type: "text",
      response: yamlText,
    };
  }
}

wss.on("connection", (ws) => {
  let currentSessionId: null = null;

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "session") {
        currentSessionId = data.sessionId;
        if (!conversations.has(currentSessionId)) {
          conversations.set(currentSessionId, [
            { role: "system", content: SYSTEM_PROMPT },
          ]);
        }
        return;
      }

      if (
        currentSessionId &&
        (data.type === "message" || data.type === "photo")
      ) {
        const conversation = conversations.get(currentSessionId);

        if (data.type === "message") {
          // Handle text message
          conversation.push({
            role: "user",
            content: data.text,
          });
        } else if (data.type === "photo") {
          // Handle photo message
          conversation.push({
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: data.data,
                },
              },
              {
                type: "text",
                text: "Please analyze this photo",
              },
            ],
          });
        }

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: conversation,
          temperature: 0.7,
        });

        const aiResponse = response.choices[0].message.content ?? "";

        // Parse the AI response into the specified format
        const parsedResponse = parseResponse(aiResponse);

        // Add AI response to conversation
        conversation.push({
          role: "assistant",
          content: aiResponse,
        });

        // Send parsed response as JSON
        ws.send(
          JSON.stringify({
            type: parsedResponse.type,
            response: parsedResponse.response,
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
