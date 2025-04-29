
import { normaliseText } from "../src/utils/normaliseText"

const text = `Generating audio using Google Text-to-Speech for text: 
Awesome, you’ve got an equation to solve: \(5x + 10 = 40\). Let's solve it together! First, what can we do to get rid of the 10 on the left side? 😊

Generating audio using Google Text-to-Speech for text: 
Let's solve this equation: \(5x + 10 = 40\). First, let's get rid of the 10 by doing the opposite operation. What do you think we should do first? 🤔`

console.log(normaliseText(text))