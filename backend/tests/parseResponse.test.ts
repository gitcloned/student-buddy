import parseResponse, { QuizContent } from "../src/utils/parseResponse";
import { describe, test, expect } from "@jest/globals";

describe('parseResponse', () => {
  // Test for speak only format
  test('should parse speak only format', () => {
    const yamlText = `---
    type: text
    speak: How are you?
    write: 
    ---`;
    
    const result = parseResponse(yamlText);
    
    expect(result).toEqual({
      type: 'text',
      speak: 'How are you?',
      write: '',
    });
  });

  // Test for speak and write format
  test('should parse speak and write format', () => {
    const yamlText = `---
    type: text
    speak: Solve 5x + 4 = 12
    write: 5x + 4 = 12
    ---`;
    
    const result = parseResponse(yamlText);
    
    expect(result).toEqual({
      type: 'text',
      speak: 'Solve 5x + 4 = 12',
      write: '5x + 4 = 12',
    });
  });

  // Test for take photo action
  test('should parse take photo action', () => {
    const yamlText = `---
    type: action
    action: take_photo
    speak: Take a photo of speaking corner
    write:
    ---`;
    
    const result = parseResponse(yamlText);
    
    expect(result).toEqual({
      type: 'action',
      action: 'take_photo',
      speak: 'Take a photo of speaking corner',
      write: '',
    });
  });

  // Test for play resource action
  test('should parse play resource action', () => {
    const yamlText = `---
    type: action
    action: play_resource
    speak: Watch this video carefully
    play: resource_01.mp4
    ---`;
    
    const result = parseResponse(yamlText);
    
    expect(result).toEqual({
      type: 'action',
      action: 'play_resource',
      speak: 'Watch this video carefully',
      play: 'resource_01.mp4',
    });
  });

  // Test for MCQ quiz
  test('should parse MCQ quiz', () => {
    const yamlText = `---
    type: quiz
    action: quiz
    speak: Answer this question
    quiz:
      type: MCQ
      step: What is 2+2
      correct: A
      options:
        - 4
        - 6
        - 8
        - 10
    ---`;
    
    const result = parseResponse(yamlText);
    
    expect(result).toEqual({
      type: 'quiz',
      action: 'quiz',
      speak: 'Answer this question',
      quiz: {
        type: 'MCQ',
        step: 'What is 2+2',
        correct: 'A',
        options: ['4', '6', '8', '10']
      },
    });
  });

  // Test for FITB quiz
  test('should parse FITB quiz', () => {
    const yamlText = `---
    type: quiz
    action: quiz
    speak: Answer this question
    quiz:
      type: FITB
      step: Term multipying a variable is called ____ ?
      correct: coefficient
      options:
        - coefficient
        - term
        - variable
    ---`;
    
    const result = parseResponse(yamlText);
    
    expect(result).toEqual({
      type: 'quiz',
      action: 'quiz',
      speak: 'Answer this question',
      quiz: {
        type: 'FITB',
        step: 'Term multipying a variable is called ____ ?',
        correct: 'coefficient',
        options: ['coefficient', 'term', 'variable']
      },
    });
  });

  // Test for YAML without delimiters
  test('should parse YAML without delimiters', () => {
    const yamlText = `type: text
    speak: How are you?
    write: `;
    
    const result = parseResponse(yamlText);
    
    expect(result).toEqual({
      type: 'text',
      speak: 'How are you?',
      write: '',
    });
  });

  // Test for fallback parsing when YAML parsing fails
  test('should use fallback parsing when YAML parsing fails', () => {
    const yamlText = `type: text
    speak: Great! Now, to find the value of x, what should we do next with the equation 5x = 30?
    write: 5x = 30
    type: text
    speak: Let's divide both sides by 5. What does that give us?
    write: 5x/5 = 30/5`;
    
    const result = parseResponse(yamlText);
    
    // The fallback parser should extract the first type and speak values
    expect(result.type).toBe('text');
    expect(result.speak).toBe("Great! Now, to find the value of x, what should we do next with the equation 5x = 30?");
    expect(result.write).toBe("5x = 30");
  });

  // Test for malformed YAML with quiz content
  test('should handle malformed YAML with quiz content', () => {
    const yamlText = `type: quiz
    action: quiz
    speak: Answer this question
    quiz:
      type: MCQ
      step: What is 2+2
      correct: A
      options:
        - 4
        - 6
        - 8
        - 10
    type: text`;
    
    const result = parseResponse(yamlText);
    
    expect(result.type).toBe('quiz');
    expect(result.action).toBe('quiz');
    expect(result.speak).toBe('Answer this question');
    expect(result.quiz).toBeDefined();
    if (result.quiz) {
      expect(result.quiz.type).toBe('MCQ');
      expect(result.quiz.step).toBe('What is 2+2');
      expect(result.quiz.correct).toBe('A');
      expect(result.quiz.options).toEqual(['4', '6', '8', '10']);
    }
  });
});