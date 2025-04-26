console.log("checking");
import parseResponse from "../src/utils/parseResponse";

const val1 = `---
type: text
text: Let's do a fun role play! We're learning how to greet a friend and ask to play together. I'll start as the child in the book: "Hello. How are you?" Now you can reply!`;

console.log("checking");
console.log(parseResponse(val1));

const val2 = `type: text
text: Let’s solve this step-by-step! We have the equation: 5x + 10 = 40. What do you think we should do first to start solving it?
write: 5x + 10 = 40`;

console.log("checking");
console.log(parseResponse(val2));
