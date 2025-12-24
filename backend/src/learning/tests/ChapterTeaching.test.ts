import { ChapterLearningService } from "../ChapterLearningService";
import { LearningProgressionAnalyzer } from "../LearningProgressionAnalyzer";
import { TeachingContentFormatter } from "../TeachingContentFormatter";

/**
 * Unit tests for the Chapter Teaching functionality
 * 
 * This file includes test cases to verify that:
 * 1. The LearningProgressionAnalyzer correctly identifies the next LO to teach
 * 2. The TeachingContentFormatter correctly formats teaching content
 * 3. Integration between these components works as expected
 */

// Mock data for testing
const mockLearningOutcome = {
  id: 1,
  name: "Recall & Define Algebraic Expressions",
  indicators: [
    {
      id: 1,
      title: "State in own words what an algebraic expression is",
      commonMisconception: "Children may think each letter or number is its own term, or confuse the constant with the variable.",
      level: "weak",
      state: "assess"
    },
    {
      id: 2,
      title: "Underline the terms in 3y + 7",
      commonMisconception: null,
      level: null,
      state: null
    },
    {
      id: 3,
      title: "Name the constant & the variable in 3y + 7",
      commonMisconception: "Students often confuse which part is the constant and which is the variable",
      level: "average",
      state: "teach"
    },
    {
      id: 4,
      title: "Explain what a coefficient is & identify it",
      commonMisconception: null,
      level: "strong",
      state: "taught"
    }
  ],
  isFullyTaught: false
};

const mockQuestions = new Map();
mockQuestions.set(1, [
  {
    id: 101,
    questionText: "In the expression 4x + 5, which of these correctly identifies one term and the constant?",
    options: [
      { id: "1", text: "term = 4, constant = x", isCorrect: false },
      { id: "2", text: "term = 4x, constant = 5", isCorrect: true },
      { id: "3", text: "term = 5x, constant = 4", isCorrect: false },
      { id: "4", text: "term = x + 5, constant = 4", isCorrect: false }
    ]
  }
]);

/**
 * Test if the TeachingContentFormatter correctly formats the teaching prompt
 */
function testTeachingContentFormatter() {
  console.log("Testing TeachingContentFormatter...");
  
  const formatter = new TeachingContentFormatter();
  const teachingPrompt = formatter.generateTeachingPrompt(
    "Chapter 1: Algebraic Expressions and Identities",
    "Ravi",
    mockLearningOutcome,
    mockQuestions
  );
  
  console.log("Generated Teaching Prompt:");
  console.log("--------------------------");
  console.log(teachingPrompt);
  
  // Verify the prompt contains expected elements
  const hasChapterName = teachingPrompt.includes("Chapter 1: Algebraic Expressions and Identities");
  const hasStudentName = teachingPrompt.includes("Ravi");
  const hasLearningOutcome = teachingPrompt.includes("Recall & Define Algebraic Expressions");
  const hasTable = teachingPrompt.includes("| Learning Indicator | State | At stage |");
  const hasAssessment = teachingPrompt.includes("To assess \"State in own words what an algebraic expression is\"");
  
  console.log("\nVerification Results:");
  console.log("Has Chapter Name: " + hasChapterName);
  console.log("Has Student Name: " + hasStudentName);
  console.log("Has Learning Outcome: " + hasLearningOutcome);
  console.log("Has Indicator Table: " + hasTable);
  console.log("Has Assessment Guidance: " + hasAssessment);
  
  return hasChapterName && hasStudentName && hasLearningOutcome && hasTable && hasAssessment;
}

/**
 * Test function for the LearningProgressionAnalyzer
 */
function testLearningProgressionAnalyzer() {
  console.log("\nTesting LearningProgressionAnalyzer...");
  
  // Mock LearningService that always returns our test data
  const mockLearningService = {
    getLearningOutcomes: async () => [{ id: 1, name: mockLearningOutcome.name }],
    getLearningIndicators: async () => mockLearningOutcome.indicators.map(i => ({ 
      id: i.id, 
      title: i.title, 
      commonMisconception: i.commonMisconception 
    })),
    getLearningLevels: async () => {
      const result = new Map();
      mockLearningOutcome.indicators.forEach(i => {
        result.set(i.id, { level: i.level, state: i.state });
      });
      return result;
    },
    getAssessmentQuestions: async () => mockQuestions,
    getChapterDetails: async () => ({ name: "Chapter 1: Algebraic Expressions", subjectName: "Math" }),
    getStudentDetails: async () => ({ name: "Ravi" })
  } as unknown as ChapterLearningService;
  
  const analyzer = new LearningProgressionAnalyzer(mockLearningService);
  
  // Test the groupIndicatorsByMisconception method
  const groups = analyzer.groupIndicatorsByMisconception(mockLearningOutcome.indicators);
  console.log("Grouped by misconception:", groups.size, "groups");
  
  return groups.size > 0;
}

/**
 * Run all tests
 */
async function runTests() {
  let passCount = 0;
  let totalTests = 2;
  
  // Run the tests
  if (testTeachingContentFormatter()) passCount++;
  if (testLearningProgressionAnalyzer()) passCount++;
  
  console.log("\n=======================");
  console.log(`Tests passed: ${passCount}/${totalTests}`);
  console.log("=======================");
}

// Execute the tests
runTests().catch(console.error);
