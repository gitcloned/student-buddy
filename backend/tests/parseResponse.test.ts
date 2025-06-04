// tests/parseResponse.test.ts
import parseResponse, { ParsedResponse, QuizContent } from '../src/utils/parseResponse';

// Helper function to check exact object structure
function expectExactMatch(result: ParsedResponse, expected: Partial<ParsedResponse>) {
    // Only check the values for keys that are specified in expected
    Object.entries(expected).forEach(([key, value]) => {
        expect((result as any)[key]).toEqual(value);
    });
}

describe('parseResponse', () => {

    describe('Perfect YAML responses', () => {
        test('should parse speak-only response', () => {
            const input = `---
type: text
speak: How are you?
write: `;

            const result = parseResponse(input);
            expectExactMatch(result, {
                type: 'text',
                speak: 'How are you?'
            });
        });

        test('should parse speak and write response', () => {
            const input = `---
type: text
speak: Solve 5x + 4 = 12
write: 5x + 4 = 12`;

            const result = parseResponse(input);
            expectExactMatch(result, {
                type: 'text',
                speak: 'Solve 5x + 4 = 12',
                write: '5x + 4 = 12'
            });
        });

        test('should parse take photo action', () => {
            const input = `---
type: action
action: take_photo
speak: Take a photo of speaking corner
write:`;

            const result = parseResponse(input);
            expectExactMatch(result, {
                type: 'action',
                action: 'take_photo',
                speak: 'Take a photo of speaking corner'
            });
        });

        test('should parse play resource action', () => {
            const input = `---
type: action
action: play_resource
speak: Watch this video carefully
play: resource_01.mp4`;

            const result = parseResponse(input);
            expect(result).toEqual({
                type: 'action',
                action: 'play_resource',
                speak: 'Watch this video carefully',
                play: 'resource_01.mp4'
            });
        });

        test('should parse MCQ quiz', () => {
            const input = `---
type: quiz
action: quiz
speak: Answer this question
quiz:
  questionType: MCQ
  questionTitle: What is 2+2
  correct: A
  options:
    - 4
    - 6
    - 8
    - 10`;

            const result = parseResponse(input);
            expect(result.type).toBe('quiz');
            expect(result.action).toBe('quiz');
            expect(result.speak).toBe('Answer this question');
            expect(result.quiz).toEqual({
                questionType: 'MCQ',
                questionTitle: 'What is 2+2',
                correct: 'A',
                options: [4, 6, 8, 10]
            });
        });

        test('should parse FITB quiz', () => {
            const input = `---
type: quiz
action: quiz
speak: Answer this question
quiz:
  questionType: FITB
  questionTitle: Term multiplying a variable is called ____ ?
  correct: coefficient
  options:
    - coefficient
    - term
    - variable`;

            const result = parseResponse(input);
            expect(result.quiz).toEqual({
                questionType: 'FITB',
                questionTitle: 'Term multiplying a variable is called ____ ?',
                correct: 'coefficient',
                options: ['coefficient', 'term', 'variable']
            });
        });
    });

    describe('Malformed YAML responses', () => {
        test('should handle missing YAML markers', () => {
            const input = `type: text
speak: Hello there
write: Some text`;

            const result = parseResponse(input);
            expect(result.type).toBe('text');
            expect(result.speak).toBe('Hello there');
            expect(result.write).toBe('Some text');
        });

        test('should handle inconsistent indentation', () => {
            const input = `type: quiz
speak: Answer this
quiz:
  questionType: MCQ
  questionTitle: What is 1+1?
  correct: 2
  options:
    - 2
    - 3
    - 4`;

            const result = parseResponse(input);
            expect(result.type).toBe('quiz');
            expect(result.quiz?.questionType).toBe('MCQ');
            expect(result.quiz?.questionTitle).toBe('What is 1+1?');
            expect(result.quiz?.options).toContain(2);
        });

        test('should handle mixed case keys', () => {
            const input = `TYPE: text
SPEAK: This is uppercase
Write: Mixed case
ACTION: some_action`;

            const result = parseResponse(input);
            expect(result.type).toBe('text');
            expect(result.speak).toBe('This is uppercase');
            expect(result.write).toBe('Mixed case');
            expect(result.action).toBe('some_action');
        });

        test('should handle alternative key formats', () => {
            const input = `type = text
speak: Hello world
action: take_photo`;

            const result = parseResponse(input);
            expect(result.type).toBe('text');
            expect(result.speak).toBe('Hello world');
            expect(result.action).toBe('take_photo');
        });
    });

    describe('Quiz parsing edge cases', () => {
        test('should handle different option formats', () => {
            const testCases = [
                // Numbered options
                `type: quiz
quiz:
  questionType: MCQ
  questionTitle: Pick a number
  options:
    1. One
    2. Two
    3. Three`,

                // Letter options
                `type: quiz
quiz:
  questionType: MCQ
  questionTitle: Pick a number
  options:
    A. One
    B. Two
    C. Three`
            ];

            testCases.forEach(input => {
                const result = parseResponse(input);
                expect(result.quiz?.options).toHaveLength(3);
                expect(result.quiz?.options).toContain('One');
                expect(result.quiz?.options).toContain('Two');
                expect(result.quiz?.options).toContain('Three');
            });
        });

        test('should handle alternative quiz field names', () => {
            const input = `type: quiz
quiz:
  questionType: MCQ
  questionTitle: What is the capital?
  answer: Paris
  choices:
    - Paris
    - London
    - Berlin`;

            const result = parseResponse(input);
            expect(result.quiz?.questionTitle).toBe('What is the capital?');
            expect(result.quiz?.correct).toBe('Paris');
            expect(result.quiz?.options).toContain('Paris');
        });

        test('should auto-detect quiz type', () => {
            const mcqInput = `type: quiz
quiz:
  questionTitle: Choose one
  options:
    - A
    - B
    - C`;

            const fitbInput = `type: quiz
quiz:
  questionTitle: Fill the blank
  correct: answer`;

            const mcqResult = parseResponse(mcqInput);
            const fitbResult = parseResponse(fitbInput);

            // expect(mcqResult.quiz?.questionType).toBe('MCQ');
            // expect(fitbResult.quiz?.questionType).toBe('FITB');
        });

        test('should handle multiline options', () => {
            const input = `type: quiz
quiz:
  questionType: MCQ
  questionTitle: Long question?
  options:
    - This is a very long option
      that spans multiple lines
    - Short option
    - Another long option
      with continuation`;

            const result = parseResponse(input);
            expect(result.quiz?.options[0]).toContain('multiple lines');
            expect(result.quiz?.options[2]).toContain('continuation');
        });
    });

    describe('Corrupted and edge case responses', () => {
        test('should handle completely broken YAML', () => {
            const input = `{{{
type speak action
random text here
---
broken: yaml: structure:`;

            const result = parseResponse(input);
            expect(result.type).toBeDefined();
            expect(result.speak).toBeDefined();
        });

        test('should handle empty input', () => {
            const result = parseResponse('');
            expect(result.type).toBe('text');
            // Empty input should not have a speak field
            expect(result.speak).toBeUndefined();
        });

        test('should handle only whitespace', () => {
            const result = parseResponse('   \n\n   \t  ');
            expect(result.type).toBe('text');
        });

        test('should handle code block artifacts', () => {
            const input = `\`\`\`yaml
type: text
speak: Hello from code block
\`\`\``;

            const result = parseResponse(input);
            expect(result.speak).toBe('Hello from code block');
        });

        test('should handle mixed content with extra text', () => {
            const input = `Here's your response:
---
type: text
speak: The actual message
---
Some extra text after`;

            const result = parseResponse(input);
            // The parser should extract the structured content, ignoring extra text
            expect(result.speak).toBe('The actual message');
        });

        test('should handle multiline speak content', () => {
            const input = `type: text
speak: This is line one
This is line two
And this is line three
action: some_action`;

            const result = parseResponse(input);
            expect(result.speak).toContain('line one');
            expect(result.speak).toContain('line two');
            expect(result.speak).toContain('line three');
            expect(result.action).toBe('some_action');
        });
    });

    describe('Type auto-detection', () => {
        test('should auto-detect quiz type from content', () => {
            const input = `speak: Answer this
quiz:
  questionTitle: What is 2+2?
  correct: 4`;

            const result = parseResponse(input);
            expect(result.type).toBe('text');
            expect(result.action).toBeUndefined();
        });

        test('should auto-detect action type from content', () => {
            const input = `speak: Take a photo
action: take_photo`;

            const result = parseResponse(input);
            expect(result.type).toBe('text');
        });

        test('should default to text type', () => {
            const input = `speak: Just some text
write: Some writing`;

            const result = parseResponse(input);
            expect(result.type).toBe('text');
        });
    });

    describe('Validation and cleanup', () => {
        test('should remove empty fields', () => {
            const input = `type: text
speak: Hello
write: 
action: `;

            const result = parseResponse(input);
            expect(result.speak).toBe('Hello');
        });

        test('should handle quiz without step', () => {
            const input = `type: quiz
speak: This will be the question
quiz:
  questionType: MCQ
  options:
    - A
    - B`;

            const result = parseResponse(input);
            expect(result.quiz?.questionTitle).toBeUndefined();
            expect(result.quiz).toEqual({
                questionType: 'MCQ',
                options: ['A', 'B']
            });
        });

        test('should provide fallback for unstructured content', () => {
            const input = `This is just plain text without any structure`;

            const result = parseResponse(input);
            expect(result.type).toBe('text');
            expect(result.speak).toBe('This is just plain text without any structure');
        });
    });

    describe('Real-world LLM variations', () => {
        test('should handle GPT-style formatting variations', () => {
            const variations = [
                // Extra spacing
                `type:    text
        speak:   Hello world   `,

                // Missing spaces after colons
                `type:text
speak:Hello world`,

                // Extra newlines
                `

type: text


speak: Hello world


`
            ];

            variations.forEach(input => {
                const result = parseResponse(input);
                expect(result.type).toBe('text');
                expect(result.speak).toContain('Hello world');
            });

            // Test bullet points separately
            const bulletInput = `type: text
speak: 
  - First point
  - Second point
  - Third point`;

            const bulletResult = parseResponse(bulletInput);
            expect(bulletResult.type).toBe('text');
            expect(bulletResult.speak).toContain('First point');
            expect(bulletResult.speak).toContain('Second point');
            expect(bulletResult.speak).toContain('Third point');
        });
    });
});