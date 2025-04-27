console.log("checking");
import parseResponse from "../src/utils/parseResponse";

// const val1 = `---
// type: text
// speak: Let's do a fun role play! We're learning how to greet a friend and ask to play together. I'll start as the child in the book: "Hello. How are you?" Now you can reply!`;

// console.log("checking");
// console.log(parseResponse(val1));

// const val2 = `type: text
// speak: Let’s solve this step-by-step! We have the equation: 5x + 10 = 40. What do you think we should do first to start solving it?
// write: 5x + 10 = 40`;

// console.log("checking");
// console.log(parseResponse(val2));


const val3 = `type: text
speak: Great! Now, to find the value of x, what should we do next with the equation 5x = 30?
write: 5x = 30
type: text
speak: Let's divide both sides by 5. What does that give us?
write: 5x/5 = 30/5"
Attempting to parse YAML: "type: text
speak: Great! Now, to find the value of x, what should we do next with the equation 5x = 30?
write: 5x = 30
type: text
speak: Let's divide both sides by 5. What does that give us?
write: 5x/5 = 30/5`

console.log("checking");
console.log(parseResponse(val3));