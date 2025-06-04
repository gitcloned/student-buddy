// Test script for parseResponse
const parseResponse = require('./dist/utils/parseResponse').default;

const testText = `आप Algebraic Expressions and Identities में आगे बढ़ रहे हो! आज हम expressions के terms को पहचानेंगे। 🤓

चलो, पहले एक आसान सा सवाल हल करते हैं। ध्यान से देखो:

---
type: quiz
action: quiz
speak: इस सवाल का जवाब दो: जताना कि term और constant क्या हैं।
quiz:
	type: MCQ
	step: Expression 4x + 5 में कौन सा सही term और constant को दर्शाता है?
	correct: B
	options:
		- A. term = 4, constant = x
		- B. term = 4x, constant = 5
		- C. term = 5x, constant = 4
		- D. term = x + 5, constant = 4

अगर इस सवाल में कोई confusion है, तो बताओ! हम सिखने के और तरीके देखेंगें! 😊`;

console.log('Testing parser with Hindi text...');
try {
  const result = parseResponse(testText);
  console.log('Parsed result:');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Parsing error:', error);
}
