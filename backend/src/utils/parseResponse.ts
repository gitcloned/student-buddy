import * as yaml from "js-yaml";

export interface QuizContent {
  type: "MCQ" | "FITB";
  step: string;
  correct: string;
  options: string[];
}

export interface ParsedResponse {
  type: string;
  speak?: string;
  action?: string;
  write?: string;
  quiz?: QuizContent;
  play?: string;
}

export default function parseResponse(text: string): ParsedResponse {
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
      speak?: string;
      action?: string;
      write?: string;
      quiz?: QuizContent;
      play?: string;
    };
    console.log(`Parsed YAML:`, parsed);

    if (!parsed.type) {
      throw new Error("No 'type' field in YAML response");
    }

    return {
      type: parsed.type,
      speak: parsed.speak,
      action: parsed.action,
      write: parsed.write,
      quiz: parsed.quiz,
      play: parsed.play,
    };
  } catch (e) {
    console.error(`YAML parsing failed: ${e}`);
    // Fallback: Manually extract type, text, and action
    const lines = yamlText.split("\n");
    let type = "text"; // Default type
    let speak = "";
    let action = "";
    let write = "";
    let quiz: QuizContent | undefined;
    let play = "";
    let inQuizBlock = false;
    let quizContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Use case-insensitive checks to be more forgiving
      if (/^type:/i.test(line)) {
        type = line.replace(/type:/i, "").trim();
      } else if (/^speak:/i.test(line)) {
        // Capture everything after "speak:" on the SAME line first
        let currentText = line.replace(/speak:/i, "").trim();
        const textLines: string[] = currentText ? [currentText] : [];

        // Keep consuming subsequent lines until we hit another recognised key
        let j = i + 1;
        for (; j < lines.length; j++) {
          const nextLine = lines[j];
          const trimmedNext = nextLine.trim();
          if (/^(action|write|type|quiz|play):/i.test(trimmedNext)) {
            break; // stop collecting text
          }
          textLines.push(nextLine.replace(/^\s+/, "")); // Preserve original spacing within the line
        }
        speak = textLines.join("\n").replace(/```/g, "").trim();
        i = j - 1; // Skip the lines we've already consumed
      } else if (/^action:/i.test(line)) {
        action = line.replace(/action:/i, "").trim();
      } else if (/^write:/i.test(line)) {
        write = line.replace(/write:/i, "").trim();
      } else if (/^play:/i.test(line)) {
        play = line.replace(/play:/i, "").trim();
      } else if (/^quiz:/i.test(line) || inQuizBlock) {
        if (!inQuizBlock) {
          inQuizBlock = true;
          continue;
        }
        
        // Collect all lines in the quiz block
        quizContent.push(line);
        
        // Check if we've reached the end of the quiz block
        if (i === lines.length - 1 || 
            (i < lines.length - 1 && /^(type|speak|action|write|play):/i.test(lines[i + 1].trim()))) {
          inQuizBlock = false;
          
          // Try to parse the collected quiz content
          try {
            const quizYaml = quizContent.join("\n");
            const parsedQuiz = yaml.load(quizYaml) as QuizContent;
            quiz = parsedQuiz;
          } catch (quizErr) {
            console.error(`Failed to parse quiz content: ${quizErr}`);
          }
          
          quizContent = [];
        }
      }
    }

    // If no text was found, use the entire input as text (minus known key lines)
    if (!speak && !action && !write && !quiz && !play) {
      speak = yamlText.trim();
    }

    return {
      type,
      speak: speak || undefined,  
      action: action || undefined,
      write: write || undefined,
      quiz,
      play: play || undefined,
    };
  }
}