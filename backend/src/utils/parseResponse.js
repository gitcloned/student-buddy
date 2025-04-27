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
            speak: parsed.speak,
            action: parsed.action,
            write: parsed.write,
        };
    }
    catch (e) {
        console.error("YAML parsing failed: ".concat(e));
        // Fallback: Manually extract type, text, and action
        var lines = yamlText.split("\n");
        var type = "text"; // Default type
        var text_1 = "";
        var action = "";
        var write = "";
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            // Use case-insensitive checks to be more forgiving
            if (/^type:/i.test(line)) {
                type = line.replace(/type:/i, "").trim();
            }
            else if (/^text:/i.test(line)) {
                // Capture everything after "text:" on the SAME line first
                var currentText = line.replace(/text:/i, "").trim();
                var textLines = currentText ? [currentText] : [];
                // Keep consuming subsequent lines until we hit another recognised key
                var j = i + 1;
                for (; j < lines.length; j++) {
                    var nextLine = lines[j];
                    var trimmedNext = nextLine.trim();
                    if (/^(action|write|type):/i.test(trimmedNext)) {
                        break; // stop collecting text
                    }
                    textLines.push(nextLine.replace(/^\s+/, "")); // Preserve original spacing within the line
                }
                text_1 = textLines.join("\n").replace(/```/g, "").trim();
                i = j - 1; // Skip the lines we've already consumed
            }
            else if (/^action:/i.test(line)) {
                action = line.replace(/action:/i, "").trim();
            }
            else if (/^write:/i.test(line)) {
                write = line.replace(/write:/i, "").trim();
            }
        }
        // If no text was found, use the entire input as text (minus known key lines)
        if (!text_1 && !action && !write) {
            text_1 = yamlText.trim();
        }
        return {
            type: type,
            text: text_1 || undefined,
            action: action || undefined,
            write: write || undefined,
        };
    }
}
