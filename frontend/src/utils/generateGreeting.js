// utils/greetings.js
export const generateGreeting = (
  userName,
  {
    teacherLanguage = 'hinglish',
    teacherStyle = 'candid'
  } = {}
) => {
  // Configuration object
  const greetingsConfig = {
    english: {
      formal: {
        timeGreetings: {
          morning: "Good morning",
          afternoon: "Good afternoon",
          evening: "Good evening",
          lateNight: "Studying late? Remember to rest well"
        },
        phrases: [
          "Let us commence our learning session",
          "Shall we begin today's lesson?",
          "I hope you're prepared for today's study plan",
          "Let's review yesterday's concepts first"
        ],
        motivations: [
          "Consistent practice leads to excellence",
          "Remember: Perseverance is key to success",
          "Quality learning requires dedicated focus"
        ]
      },
      candid: {
        timeGreetings: {
          morning: "Rise and shine! Ready to learn?",
          afternoon: "Post-lunch energy time!",
          evening: "Perfect evening for productive study",
          lateNight: "Night owl mode activated!"
        },
        phrases: [
          "What's on your study radar today?",
          "Feeling stuck anywhere? Let's tackle it!",
          "Quick recap first, then new topics!",
          "Ready to crush today's goals?"
        ],
        motivations: [
          "You got this! One step at a time",
          "Progress > perfection! Keep going",
          "Small daily improvements compound big time"
        ]
      }
    },
    hinglish: {
      formal: {
        timeGreetings: {
          morning: "Suprabhat! Let's begin today's paath",
          afternoon: "Dopahar ke baad ki padhai shuru karein",
          evening: "Sanyam ke sath sandhya ka adhyayan",
          lateNight: "Ratri mein adhyayan, par santulan rakhein"
        },
        phrases: [
          "Aaj ka syllabus kya hai?",
          "Pichhle adhyay ka revision ho gaya?",
          "Koi shankya ya sankat?",
          "Vyakti gat udaharan ke sath samjhein"
        ],
        motivations: [
          "Niyamit abhyas se praapt hota hai saphalta",
          "Shiksha ka mahatva samajhte hue aage badhein",
          "Prashn patra ki taiyari ke liye samay samarpit karein"
        ]
      },
      candid: {
        timeGreetings: {
          morning: "Chai peeke shuru karein? ☕",
          afternoon: "Break ke baad full dhyaan se!",
          evening: "Evening ki fresh shuruaat!",
          lateNight: "Raat ke 11 baj gaye, thoda aaram bhi zaroori hai!"
        },
        phrases: [
          "Aaj ka target kya fix kiya? 🎯",
          "Kuch interesting doubt hai? Poochho!",
          "Chalo ek quick revision mar lete hain",
          "Aaj ka special topic kya hai?"
        ],
        motivations: [
          "Padhoge likhoge to banoge nawab! 😉",
          "Thoda aur try karo, answer dikh raha hai!",
          "Kal result dekhenge, aaj mehnat karenge!"
        ]
      }
    },
    hindi: {
      formal: {
        timeGreetings: {
          morning: "प्रभात! आज की पढ़ाई प्रारंभ करें",
          afternoon: "दोपहर उपरांत अध्ययन सत्र",
          evening: "सायंकालीन शिक्षण का समय",
          lateNight: "रात्रि पठन के साथ विश्राम का ध्यान रखें"
        },
        phrases: [
          "आज का पाठ्यक्रम क्या है?",
          "पिछले अध्याय का पुनरावलोकन हो गया?",
          "किसी प्रश्न में कठिनाई हो रही है?",
          "आरंभ करने से पूर्व लक्ष्य निर्धारित करें"
        ],
        motivations: [
          "नियमित अभ्यास सफलता की कुंजी है",
          "अध्यवसाय से समस्त बाधाएं दूर होती हैं",
          "ज्ञानार्जन में एकाग्रता आवश्यक है"
        ]
      },
      candid: {
        timeGreetings: {
          morning: "चाय के साथ पढ़ाई शुरू करें? ☕",
          afternoon: "लंच के बाद फिर से जोश!",
          evening: "शाम को बनाएं उत्पादक",
          lateNight: "रात गहरी हो रही है, सावधानी से!"
        },
        phrases: [
          "आज क्या टारगेट रखा है? 🎯",
          "कोई मजेदार सवाल? बताओ!",
          "चलो एक ट्रिक से समझते हैं",
          "कल जो पढ़ा था, याद है?"
        ],
        motivations: [
          "कर लो थोड़ी और मेहनत! 💪",
          "लगे रहो, समझ आ ही जाएगा!",
          "परीक्षा में चमकने का समय है!"
        ]
      }
    }
  };

  // Helper functions
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 4) return 'lateNight';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'lateNight';
  };

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const config = greetingsConfig[teacherLanguage][teacherStyle]
    || greetingsConfig.hinglish.candid;

  // Randomly decide to skip timeGreeting or motivation
  const skipTimeGreeting = Math.random() < 0.5; // 50% chance
  const skipMotivation = Math.random() < 0.5;   // 50% chance

  const timeGreeting = config.timeGreetings[getTimeOfDay()];
  const mainPhrase = getRandom(config.phrases);
  const motivation = getRandom(config.motivations);
  const nameGreeting = userName ? `, ${userName}` : '';

  let parts = [];
  if (!skipTimeGreeting) parts.push(`${timeGreeting}${nameGreeting}!`);
  parts.push(mainPhrase);
  if (!skipMotivation) parts.push(`\n${motivation}`);

  return parts.join('\n');
};