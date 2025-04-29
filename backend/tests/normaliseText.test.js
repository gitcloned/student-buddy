"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var normaliseText_1 = require("../src/utils/normaliseText");
var text = "Generating audio using Google Text-to-Speech for text: \nAwesome, you\u2019ve got an equation to solve: (5x + 10 = 40). Let's solve it together! First, what can we do to get rid of the 10 on the left side? \uD83D\uDE0A\n\nGenerating audio using Google Text-to-Speech for text: \nLet's solve this equation: (5x + 10 = 40). First, let's get rid of the 10 by doing the opposite operation. What do you think we should do first? \uD83E\uDD14";
console.log((0, normaliseText_1.normaliseText)(text));
