import { LearningIndicatorWithState, LearningOutcomeWithProgress, AssessmentQuestion } from "./LearningProgressionAnalyzer";

/**
 * Formats teaching content based on learning progression data
 */
export class TeachingContentFormatter {
  /**
   * Generates a complete teaching prompt with chapter, topic, and LI information
   */
  generateTeachingPrompt(
    chapterName: string,
    studentName: string,
    learningOutcome: LearningOutcomeWithProgress,
    questions: Map<number, AssessmentQuestion[]>
  ): string {
    // Format the header with chapter information
    let prompt = this.formatAssessmentGuidance();

    prompt += `\n\nCurrent chapter: '${chapterName}'`;

    // Add student and learning outcome information
    prompt += `\n${studentName} is currently at this topic: '${learningOutcome.name}'`;
    prompt += `\n\nBelow is her progression across different learning indicators for this topic\n\n`;
    
    // Create a table for learning indicators
    prompt += this.formatLearningIndicatorsTable(learningOutcome.indicators);
    
    // Add specific assessment questions for LIs in 'assess' state
    prompt += this.formatAssessmentQuestions(learningOutcome.indicators, questions);
    
    return prompt;
  }
  
  /**
   * Formats a table of learning indicators with their states
   */
  private formatLearningIndicatorsTable(indicators: LearningIndicatorWithState[]): string {
    let table = `| Learning Indicator | State | At stage |\n`;
    table += `| ----------------- | ----- | -------- |\n`;
    
    indicators.forEach(li => {
      const state = li.level || "Unknown";
      const stage = li.state || "assess";
      table += `| ${li.title} | ${state} | ${stage} |\n`;
    });
    
    table += `\n`;
    return table;
  }
  
  /**
   * Formats general assessment guidance
   */
  private formatAssessmentGuidance(): string {
    let guidance = `How to teach:\n---\n\n`;
    
    guidance += `For each topic - student will go through the following stages:
1. Assess (Where student will be given a question and he will answer it. If student makes a mistake, you can give a hint to student and give him a chance to redo his answer. If student keeps on making a mistake, then you should switch to Teach mode. If student answers correctly in the first attempt and ask another question. Basis the answer of the question you can either switch to teach mode or if answered correctly without any hint then declare mastery of this topic and move to next topic)
2. Teach (If student is not able to answer in assess mode or need hints to answer or makes conceptual errors repeatedly, then you will switch to teach mode and teach student by showing a video, video can be fetched by calling the teach tool and passing the LOs and other details to it. Once student says he has understood the concept, you can switch to asses mode again)`
    return guidance;
  }
  
  /**
   * Formats assessment questions for LIs in 'assess' state
   */
  private formatAssessmentQuestions(
    indicators: LearningIndicatorWithState[],
    questions: Map<number, AssessmentQuestion[]>
  ): string {
    let content = '';
    
    // Find indicators that need assessment
    const assessIndicators = indicators.filter(li => li.state === 'assess' || !li.state);
    
    if (assessIndicators.length === 0) {
      return content;
    }
    
    // Group indicators by misconception to organize questions
    const misconceptionGroups = this.groupByMisconception(assessIndicators);
    
    // Format content for each misconception group
    for (const [misconception, indicators] of misconceptionGroups) {
      if (indicators.length === 0) continue;
      
      const firstIndicator = indicators[0];
      content += `To assess "${firstIndicator.title}" can use below questions:\n\n`;
      
      // Add misconception information
      if (misconception !== 'General') {
        content += `Typical misconception: ${misconception}\n\n`;
      }
      
      // Add questions for this indicator
      const indicatorQuestions = questions.get(firstIndicator.id) || [];
      
      if (indicatorQuestions.length > 0) {
        const question = indicatorQuestions[0];
        content += `Question: ${question.title}
`;
        
        if (question.description) {
          content += `Description: ${question.description}
`;
        }
        
        content += `
`;
      } else if (firstIndicator.commonMisconception) {
        // Fallback if no questions found but we have misconception info
        content += `Example question: In the context of "${firstIndicator.title}", test for the common misconception: ${firstIndicator.commonMisconception}\n\n`;
      }
    }
    
    return content;
  }
  
  /**
   * Groups indicators by their common misconception
   */
  private groupByMisconception(
    indicators: LearningIndicatorWithState[]
  ): Map<string, LearningIndicatorWithState[]> {
    const groups = new Map<string, LearningIndicatorWithState[]>();
    
    for (const indicator of indicators) {
      const misconception = indicator.commonMisconception || 'General';
      
      if (!groups.has(misconception)) {
        groups.set(misconception, []);
      }
      
      groups.get(misconception)!.push(indicator);
    }
    
    return groups;
  }
}
