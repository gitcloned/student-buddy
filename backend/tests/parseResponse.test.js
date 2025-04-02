"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
console.log("checking");
var parseResponse_1 = require("../src/utils/parseResponse");
var val1 = "---\ntype: text\ntext: Let's do a fun role play! We're learning how to greet a friend and ask to play together. I'll start as the child in the book: \"Hello. How are you?\" Now you can reply!";
console.log("checking");
console.log((0, parseResponse_1.default)(val1));
