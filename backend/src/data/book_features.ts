import { SPEAKING_CORNER_PROMPT } from "./features/speaking_corner";

export const BOOK_FEATURES = [
  {
    id: 100,
    features: [
      {
        id: 1,
        subject: "English",
        name: "Speaking corner",
        howToTeach: SPEAKING_CORNER_PROMPT,
      },
      {
        id: 2,
        subject: "English",
        name: "Phoenics",
        howToTeach:
          "Use sound-symbol relationships to teach letter sounds and word formation",
      },
    ],
  },
  {
    id: 101,
    features: [
      {
        id: 3,
        subject: "Maths",
        name: "Practice zone",
        howToTeach:
          "Provide step-by-step problem solving guidance with increasing difficulty",
      },
      {
        id: 4,
        subject: "Maths",
        name: "Apply it",
        howToTeach:
          "Present real-world scenarios to apply mathematical concepts",
      },
    ],
  },
];
