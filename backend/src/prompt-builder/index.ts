import { Session } from "../Session";
import { buildIntro } from "./intro";
import { buildTeachingStyle } from "./teaching-style";
import { buildWhatToTeach } from "./what-to-teach";
import { buildClassroomSetup } from "./classroom-setup";
import { buildReplyFormat } from "./reply-format";

/**
 * A singleton class that builds prompts for the AI teacher
 */
export class PromptBuilder {
  private static instance: PromptBuilder;

  private constructor() {}

  /**
   * Gets the singleton instance of PromptBuilder
   */
  public static getInstance(): PromptBuilder {
    if (!PromptBuilder.instance) {
      PromptBuilder.instance = new PromptBuilder();
    }
    return PromptBuilder.instance;
  }

  /**
   * Builds the complete system prompt by combining all sections
   * @param session The current session with all necessary context
   */
  public async buildSystemPrompt(session: Session): Promise<string> {
    return [
      buildIntro(session),
      buildTeachingStyle(session),
      buildWhatToTeach(session),
      buildClassroomSetup(session),
      buildReplyFormat(session),
    ].join('\n\n');
  }
}
