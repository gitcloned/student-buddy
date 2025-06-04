import React, { useState, useEffect } from "react";

const QuizModal = ({ quiz, onSubmit, onClose, readOnly = false }) => {
  const [selectedOption, setSelectedOption] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    // Reset state when quiz changes
    setSelectedOption("");
    setInputValue("");
    setShowFeedback(false);
  }, [quiz]);

  const handleSubmit = () => {
    if (quiz.type === "MCQ") {
      const optionIndex = "ABCDEFGHIJKLMN".indexOf(quiz.correct.toUpperCase());
      const correctOption = quiz.options[optionIndex];
      const userOption = selectedOption;
      const isCorrect = userOption === correctOption;
      
      setIsCorrect(isCorrect);
      setShowFeedback(true);

      if (!readOnly) {
        const selectedLetter = "ABCDEFGHIJKLMN"[quiz.options.indexOf(userOption)];
        onSubmit({
          type: "quiz_answer",
          quizType: "MCQ",
          userAnswer: userOption,
          userAnswerLetter: selectedLetter,
          isCorrect,
          correctAnswer: correctOption,
          correctAnswerLetter: quiz.correct,
        });
      }
    } else if (quiz.type === "FITB") {
      const correctAnswer = Array.isArray(quiz.correct) 
        ? quiz.correct.map(a => a.toLowerCase()) 
        : [quiz.correct.toLowerCase()];
      
      const userAnswer = inputValue.trim().toLowerCase();
      const isCorrect = correctAnswer.includes(userAnswer);
      
      setIsCorrect(isCorrect);
      setShowFeedback(true);

      if (!readOnly) {
        onSubmit({
          type: "quiz_answer",
          quizType: "FITB",
          userAnswer: inputValue,
          isCorrect,
          correctAnswer: Array.isArray(quiz.correct) ? quiz.correct[0] : quiz.correct,
        });
      }
    }
  };

  // Generate unique option letters (A, B, C, etc.)
  const getOptionLetter = (index) => {
    return "ABCDEFGHIJKLMN"[index];
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#244d2b]">
            {quiz.type === "MCQ" ? "Multiple Choice Question" : "Fill in the Blank"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {quiz.title || quiz.step || "Question:"}
          </h3>

          {quiz.type === "MCQ" && (
            <div className="space-y-3">
              {quiz.options.map((option, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedOption === option
                      ? "border-[#244d2b] bg-[#edf7ed]"
                      : "border-gray-300 hover:border-[#244d2b]"
                  }`}
                  onClick={() => setSelectedOption(option)}
                >
                  <div className="flex items-center">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full border border-[#244d2b] mr-3">
                      {getOptionLetter(index)}
                    </div>
                    <span>{option}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {quiz.type === "FITB" && (
            <div className="mt-4">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your answer here"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#244d2b]"
                />
              </div>
            </div>
          )}
        </div>

        {showFeedback && (
          <div
            className={`p-4 rounded-lg mb-4 ${
              isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            <p className="font-medium">
              {isCorrect
                ? "Correct! Well done!"
                : `Incorrect. The correct answer is ${
                    quiz.type === "MCQ" 
                      ? `${quiz.correct}: ${quiz.options["ABCDEFGHIJKLMN".indexOf(quiz.correct.toUpperCase())]}` 
                      : quiz.correct
                  }`}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          {!showFeedback ? (
            <button
              onClick={handleSubmit}
              disabled={
                (quiz.type === "MCQ" && !selectedOption) ||
                (quiz.type === "FITB" && !inputValue)
              }
              className={`px-4 py-2 rounded-lg ${
                (quiz.type === "MCQ" && !selectedOption) ||
                (quiz.type === "FITB" && !inputValue)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#244d2b] text-white hover:bg-[#1a3a20]"
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#244d2b] text-white rounded-lg hover:bg-[#1a3a20]"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizModal;
