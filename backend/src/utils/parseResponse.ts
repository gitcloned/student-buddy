import * as yaml from "js-yaml";

export interface QuizContent {
  questionType: "MCQ" | "FITB";
  questionTitle: string;
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

// Utility function to normalize strings for comparison
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/[^\w]/g, '');
}

// Clean common LLM formatting artifacts
function cleanText(text: string): string {
  return text
    .replace(/```yaml/gi, '')
    .replace(/```/g, '')
    .replace(/^\s*[-*]\s*/gm, '') // Remove bullet points at start of lines
    .trim();
}

// Extract key-value pairs with flexible matching
function extractKeyValue(line: string, key: string): string | null {
  const patterns = [
    new RegExp(`^\\s*${key}\\s*:\\s*(.*)$`, 'i'),
    new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`, 'i'),
    new RegExp(`^\\s*${key}\\s+(.*)$`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

// Check if a line is a key-value pair
function isKeyValueLine(line: string): boolean {
  const mainKeys = ['type', 'speak', 'action', 'write', 'quiz', 'play'];
  const quizKeys = ['questiontype', 'type', 'questiontitle', 'step', 'question', 'title', 'correct', 'answer', 'options', 'choices'];
  
  const trimmed = line.trim().toLowerCase();
  for (const key of [...mainKeys, ...quizKeys]) {
    if (trimmed.startsWith(key + ':') || trimmed.startsWith(key + ' ') || trimmed.startsWith(key + '=')) {
      return true;
    }
  }
  return false;
}

// Parse options with multiple formats
function parseOptions(lines: string[], startIndex: number): { options: string[], nextIndex: number } {
  const options: string[] = [];
  let i = startIndex;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed) {
      i++;
      continue;
    }
    
    // Stop if we hit a key-value line
    if (isKeyValueLine(line)) {
      break;
    }
    
    // Different option formats
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
      // Standard list format: - option
      options.push(trimmed.replace(/^[-*•]\s*/, '').trim());
    } else if (/^\d+[\.)]\s/.test(trimmed)) {
      // Numbered format: 1. option or 1) option
      options.push(trimmed.replace(/^\d+[\.)]\s*/, '').trim());
    } else if (/^[A-D][\.)]\s/i.test(trimmed)) {
      // Letter format: A. option or A) option
      options.push(trimmed.replace(/^[A-D][\.)]\s*/i, '').trim());
    } else if (trimmed && !trimmed.includes(':') && options.length > 0) {
      // Continuation of previous option (multiline)
      options[options.length - 1] += ' ' + trimmed;
    } else if (trimmed && !trimmed.includes(':')) {
      // Plain text option (no prefix)
      options.push(trimmed);
    }
    
    i++;
  }
  
  return { options, nextIndex: i };
}

// Enhanced quiz parsing with better YAML structure awareness
function parseQuizBlock(lines: string[], startIndex: number): { quiz: QuizContent | null, nextIndex: number } {
  let questionType: "MCQ" | "FITB" | null = null;
  let questionTitle = "";
  let correct = "";
  let options: string[] = [];
  let i = startIndex;
  let baseIndent = -1;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const indent = line.search(/\S/);
    
    if (!trimmed) {
      i++;
      continue;
    }
    
    // Set base indentation from first meaningful line
    if (baseIndent === -1 && trimmed) {
      baseIndent = indent;
    }
    
    // Stop if we hit a main section (same or less indentation than base, and it's a main key)
    if (indent <= baseIndent && isKeyValueLine(line)) {
      const mainKeys = ['type', 'speak', 'action', 'write', 'play'];
      const key = trimmed.split(/[:\s=]/)[0].toLowerCase();
      if (mainKeys.includes(key)) {
        break;
      }
    }
    
    let value: string | null;
    
    // Parse quiz questionType (handle both old 'type' and new 'questionType')
    if ((value = extractKeyValue(trimmed, 'questiontype')) || (value = extractKeyValue(trimmed, 'type'))) {
      const normalizedType = normalizeString(value);
      if (normalizedType.includes('mcq') || normalizedType.includes('multiplechoice')) {
        questionType = "MCQ";
      } else if (normalizedType.includes('fitb') || normalizedType.includes('fillblank') || normalizedType.includes('blank')) {
        questionType = "FITB";
      }
    }
    // Parse questionTitle (handle multiple field names)
    else if ((value = extractKeyValue(trimmed, 'questiontitle')) || 
             (value = extractKeyValue(trimmed, 'step')) ||
             (value = extractKeyValue(trimmed, 'question')) || 
             (value = extractKeyValue(trimmed, 'title'))) {
      questionTitle = value;
    }
    // Parse correct answer
    else if ((value = extractKeyValue(trimmed, 'correct')) || 
             (value = extractKeyValue(trimmed, 'answer'))) {
      correct = value;
    }
    // Parse options
    else if (/^(options|choices):/i.test(trimmed)) {
      const result = parseOptions(lines, i + 1);
      options = result.options;
      i = result.nextIndex - 1; // Will be incremented at end of loop
    }
    
    i++;
  }
  
  // Validate and create quiz object
  if (questionTitle || options.length > 0) {
    // Auto-detect questionType if not specified
    if (!questionType) {
      questionType = options.length > 1 ? "MCQ" : "FITB";
    }
    
    return {
      quiz: {
        questionType,
        questionTitle: questionTitle || "",
        correct: correct || "",
        options: options
      },
      nextIndex: i
    };
  }
  
  return { quiz: null, nextIndex: i };
}

// Collect multiline content until next key
function collectMultilineContent(lines: string[], startIndex: number, initialValue: string): { content: string, nextIndex: number } {
  const contentLines = [initialValue];
  let i = startIndex;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed) {
      i++;
      continue;
    }
    
    // Stop if we hit YAML boundary markers
    if (trimmed === '---' || trimmed === '...') {
      break;
    }
    
    // Stop if we hit a key-value line
    if (isKeyValueLine(line)) {
      break;
    }
    
    contentLines.push(line);
    i++;
  }
  
  return {
    content: contentLines.join('\n').trim(),
    nextIndex: i
  };
}

// Main parsing function with comprehensive fallback strategies
export default function parseResponse(text: string): ParsedResponse {
  console.log(`Raw LLM response: "${text}"`);

  // Clean and normalize input
  let cleanedText = cleanText(text);
  
  // Remove YAML markers and extract content between them
  const lines = cleanedText.split('\n');
  let yamlStartIndex = -1;
  let yamlEndIndex = -1;
  
  // Find YAML boundaries
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === '---') {
      if (yamlStartIndex === -1) {
        yamlStartIndex = i;
      } else {
        yamlEndIndex = i;
        break;
      }
    }
  }
  
  // Extract only the YAML content
  if (yamlStartIndex !== -1) {
    const endIndex = yamlEndIndex !== -1 ? yamlEndIndex : lines.length;
    cleanedText = lines.slice(yamlStartIndex + 1, endIndex).join('\n').trim();
  }

  // Strategy 1: Try standard YAML parsing
  try {
    const parsed = yaml.load(cleanedText) as any;
    console.log(`YAML parsed successfully:`, parsed);
    
    if (parsed && typeof parsed === 'object') {
      // Build clean result with only meaningful values
      const normalized: ParsedResponse = {
        type: parsed.type || 'text'
      };
      
      // Helper function to check if value is meaningful
      const isValidValue = (val: any): boolean => {
        return val !== null && val !== undefined && 
               (typeof val !== 'string' || val.trim() !== '');
      };
      
      // Only add fields that have meaningful values
      if (isValidValue(parsed.speak)) normalized.speak = String(parsed.speak).trim();
      if (isValidValue(parsed.action)) normalized.action = String(parsed.action).trim();
      if (isValidValue(parsed.write)) normalized.write = String(parsed.write).trim();
      if (isValidValue(parsed.play)) normalized.play = String(parsed.play).trim();
      
      // Handle quiz object with new attribute names
      if (parsed.quiz && typeof parsed.quiz === 'object') {
        const questionTitle = parsed.quiz.questionTitle || parsed.quiz.step || parsed.quiz.question || parsed.quiz.title;
        const correct = parsed.quiz.correct || parsed.quiz.answer;
        const questionType = parsed.quiz.questionType || parsed.quiz.type;
        
        if (questionTitle || (parsed.quiz.options && Array.isArray(parsed.quiz.options))) {
          const quiz: QuizContent = {
            questionType: questionType || 'MCQ',
            questionTitle: questionTitle ? String(questionTitle) : '',
            correct: correct ? String(correct) : '',
            // Ensure ALL options are converted to strings
            options: Array.isArray(parsed.quiz.options) ? 
              parsed.quiz.options.map((opt: any) => String(opt).trim()) : []
          };
          normalized.quiz = quiz;
        }
      }
      
      return normalized;
    }
  } catch (e) {
    console.warn(`YAML parsing failed, using fallback: ${e}`);
  }

  // Strategy 2: Line-by-line parsing with enhanced flexibility
  const lines = cleanedText.split('\n');
  const result: ParsedResponse = { type: 'text' };
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed) {
      i++;
      continue;
    }
    
    let value: string | null;
    
    // Parse main fields
    if ((value = extractKeyValue(trimmed, 'type'))) {
      result.type = value;
    }
    else if ((value = extractKeyValue(trimmed, 'action'))) {
      if (value.trim()) result.action = value.trim();
    }
    else if ((value = extractKeyValue(trimmed, 'write'))) {
      if (value.trim()) result.write = value.trim();
    }
    else if ((value = extractKeyValue(trimmed, 'play'))) {
      if (value.trim()) result.play = value.trim();
    }
    else if ((value = extractKeyValue(trimmed, 'speak'))) {
      // Collect multiline speak content
      const contentResult = collectMultilineContent(lines, i + 1, value);
      if (contentResult.content.trim()) {
        result.speak = contentResult.content;
      }
      i = contentResult.nextIndex - 1; // Will be incremented at end of loop
    }
    else if (/^quiz:/i.test(trimmed)) {
      const quizResult = parseQuizBlock(lines, i + 1);
      if (quizResult.quiz) {
        result.quiz = quizResult.quiz;
      }
      i = quizResult.nextIndex - 1; // Will be incremented at end of loop
    }
    
    i++;
  }

  // Strategy 3: Smart fallbacks and validation
  
  // If no structured content found, treat entire input as speak
  if (!result.speak && !result.action && !result.write && !result.quiz && !result.play) {
    const fallbackText = cleanedText.trim();
    if (fallbackText) result.speak = fallbackText;
  }
  
  // Auto-detect type based on content
  if (result.type === 'text') {
    if (result.quiz) {
      result.type = 'quiz';
      if (!result.action) result.action = 'quiz';
    } else if (result.action) {
      result.type = 'action';
    }
  }
  
  // Validate quiz content
  if (result.quiz) {
    if (!result.quiz.questionTitle && result.speak) {
      console.warn('Quiz missing questionTitle, using speak content');
      result.quiz.questionTitle = result.speak;
    }
    
    if (!result.quiz.questionType) {
      result.quiz.questionType = result.quiz.options.length > 1 ? 'MCQ' : 'FITB';
    }
  }
  
  // Final cleanup - create completely clean result object
  const cleanResult: ParsedResponse = { type: result.type };
  
  // Only add properties that exist and have meaningful values
  if (result.speak) cleanResult.speak = result.speak;
  if (result.action) cleanResult.action = result.action;
  if (result.write) cleanResult.write = result.write;
  if (result.play) cleanResult.play = result.play;
  if (result.quiz) cleanResult.quiz = result.quiz;
  
  console.log('Final parsed result:', cleanResult);
  return cleanResult;
}