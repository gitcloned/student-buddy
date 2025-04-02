console.log("checking");
import parseResponse from "../src/utils/parseResponse";

const val1 = `---
type: text
text: Let's do a fun role play! We're learning how to greet a friend and ask to play together. I'll start as the child in the book: "Hello. How are you?" Now you can reply!`;

console.log("checking");
console.log(parseResponse(val1));
