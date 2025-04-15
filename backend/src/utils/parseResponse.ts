import * as yaml from "js-yaml";

export default function parseResponse(text: string): {
  type: string;
  text?: string;
  action?: string;
} {
  console.log(`Raw GPT response: "${text}"`);

  // Trim whitespace and newlines
  let yamlText = text.trim();

  // Handle YAML with --- delimiters
  if (yamlText.startsWith("---")) {
    yamlText = yamlText
      .replace(/^---\s*\n/, "")
      .replace(/\n---\s*$/, "")
      .trim();
    console.log(`Extracted YAML without markers: "${yamlText}"`);
  }

  // Try to parse as YAML first
  try {
    console.log(`Attempting to parse YAML: "${yamlText}"`);
    const parsed = yaml.load(yamlText) as {
      type?: string;
      text?: string;
      action?: string;
    };
    console.log(`Parsed YAML:`, parsed);

    if (!parsed.type) {
      throw new Error("No 'type' field in YAML response");
    }

    return {
      type: parsed.type,
      text: parsed.text,
      action: parsed.action,
    };
  } catch (e) {
    console.error(`YAML parsing failed: ${e}`);
    // Fallback: Manually extract type, text, and action
    const lines = yamlText.split("\n");
    let type = "text"; // Default type
    let text = "";
    let action = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("type:")) {
        type = line.replace("type:", "").trim();
      } else if (line.startsWith("text:")) {
        // Extract everything after "text:" as the text value
        text = line.replace("text:", "").trim();
        // If the text spans multiple lines, append them until we hit "action:" or end
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();
          if (nextLine.startsWith("action:")) {
            action = nextLine.replace("action:", "").trim();
            break;
          } else if (nextLine) {
            text += " " + nextLine;
          }
        }

        text = text.replace("```", "");

      } else if (line.startsWith("action:")) {
        action = line.replace("action:", "").trim();
      }
    }

    // If no text was found, use the entire input as text (minus type/action lines)
    if (!text && !action) {
      text = yamlText.trim();
    }

    return {
      type,
      text: text || undefined,
      action: action || undefined,
    };
  }
}