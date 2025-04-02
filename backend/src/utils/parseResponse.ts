import * as yaml from "js-yaml";

export default function parseResponse(text: string): {
  type: string;
  text?: string;
  action?: string;
} {
  console.log(`Raw GPT response: "${text}"`); // Log the full raw response

  // Trim whitespace and newlines
  let yamlText = text.trim();

  // Check for YAML markdown wrappers
  const hasYamlMarkers = /```yaml\n([\s\S]*?)\n```/.test(yamlText);
  if (hasYamlMarkers) {
    const match = yamlText.match(/```yaml\n([\s\S]*?)\n```/);
    yamlText = match ? match[1].trim() : yamlText;
    console.log(`Extracted YAML from markers: "${yamlText}"`);
  } else if (yamlText.startsWith("---")) {
    // Handle YAML with --- delimiters
    yamlText = yamlText
      .replace(/^---\s*\n/, "")
      .replace(/\n---\s*$/, "")
      .trim();
    console.log(`Extracted YAML without markers: "${yamlText}"`);
  }

  // Try to parse as YAML
  try {
    const parsed = yaml.load(yamlText) as {
      type?: string;
      text?: string;
      action?: string;
    };
    console.log(`Parsed YAML:`, parsed);

    // Validate that we have a valid type
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
    // Fallback: Assume it's a plain text response if YAML parsing fails
    return {
      type: "text",
      text: yamlText || text.trim(), // Use original text if yamlText is empty
    };
  }
}
