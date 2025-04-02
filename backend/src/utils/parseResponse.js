"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = parseResponse;
var yaml = require("js-yaml");
function parseResponse(text) {
    console.log("Raw GPT response: \"".concat(text, "\""));
    // Trim whitespace and newlines
    var yamlText = text.trim();
    // Handle YAML with --- delimiters
    if (yamlText.startsWith("---")) {
        yamlText = yamlText
            .replace(/^---\s*\n/, "")
            .replace(/\n---\s*$/, "")
            .trim();
        console.log("Extracted YAML without markers: \"".concat(yamlText, "\""));
    }
    // Try to parse as YAML first
    try {
        console.log("Attempting to parse YAML: \"".concat(yamlText, "\""));
        var parsed = yaml.load(yamlText);
        console.log("Parsed YAML:", parsed);
        if (!parsed.type) {
            throw new Error("No 'type' field in YAML response");
        }
        return {
            type: parsed.type,
            text: parsed.text,
            action: parsed.action,
        };
    }
    catch (e) {
        console.error("YAML parsing failed: ".concat(e));
        // Fallback: Manually extract type, text, and action
        var lines = yamlText.split("\n");
        var type = "text"; // Default type
        var text_1 = "";
        var action = "";
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.startsWith("type:")) {
                type = line.replace("type:", "").trim();
            }
            else if (line.startsWith("text:")) {
                // Extract everything after "text:" as the text value
                text_1 = line.replace("text:", "").trim();
                // If the text spans multiple lines, append them until we hit "action:" or end
                for (var j = i + 1; j < lines.length; j++) {
                    var nextLine = lines[j].trim();
                    if (nextLine.startsWith("action:")) {
                        action = nextLine.replace("action:", "").trim();
                        break;
                    }
                    else if (nextLine) {
                        text_1 += " " + nextLine;
                    }
                }
            }
            else if (line.startsWith("action:")) {
                action = line.replace("action:", "").trim();
            }
        }
        // If no text was found, use the entire input as text (minus type/action lines)
        if (!text_1 && !action) {
            text_1 = yamlText.trim();
        }
        return {
            type: type,
            text: text_1 || undefined,
            action: action || undefined,
        };
    }
}
