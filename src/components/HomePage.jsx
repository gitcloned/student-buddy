import React, { useState, useEffect, useCallback } from 'react';
import mascot from '../assets/mascot.webp';

const HomePage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2));

  // Speech synthesis setup
  const speakText = useCallback((text) => {
    const synthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthesis.getVoices();
    utterance.voice = voices.find(voice => voice.name === 'Google हिन्दी');
    synthesis.speak(utterance);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000');
    setSocket(ws);

    ws.onopen = () => {
      console.log('WebSocket connection established');
      // Send session ID when connecting
      ws.send(JSON.stringify({ type: 'session', sessionId }));
      setMessages([{ type: 'mascot', text: 'Hi! I\'m your study buddy. How can I help you today?' }]);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ai_response') {
        setMessages(prev => [...prev, { type: 'mascot', text: data.text }]);
        speakText(data.text);
      } else if (data.type === 'error') {
        console.error('Error:', data.message);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setMessages(prev => [...prev, { type: 'system', text: 'Connection error. Please try again.' }]);
    };

    return () => ws.close();
  }, [sessionId, speakText]);

  // Speech recognition setup
  useEffect(() => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setMessages(prev => [...prev, { type: 'user', text: speechResult }]);
      if (socket) {
        socket.send(JSON.stringify({
          type: 'message',
          sessionId,
          text: speechResult
        }));
      }
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    // Attach to window for button click handler
    window.recognition = recognition;
  }, [socket, sessionId]);

  const handleStartListening = () => {
    try {
      window.recognition.start();
      setIsListening(true);
      setMessages(prev => [...prev, { type: 'system', text: 'Listening... Speak now.' }]);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket) {
      const message = { type: 'message', sessionId, text: inputMessage };
      socket.send(JSON.stringify(message));
      setMessages(prev => [...prev, { type: 'user', text: inputMessage }]);
      setInputMessage('');
    }
  };

  return (
    <div className="relative w-full h-full bg-white flex flex-row rounded-2xl ">
      {/* Mascot */}
      <div className="left-4 bottom-4 flex items-center w-[30vw]">
        <img src={mascot} alt="Study Buddy Mascot" className="w-[30vw] object-contain" />
      </div>

      {/* Chat Container */}
      <div className="flex-grow mb-20 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.type === 'user'
                    ? 'bg-yellow-200'
                    : message.type === 'system'
                    ? 'bg-gray-200'
                    : 'bg-[#fd9b9e] text-[#244d2b]'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Form and Voice Button */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button
          onClick={handleStartListening}
          disabled={isListening}
          className={`bg-[#f0e6b0] p-3 rounded-full hover:bg-yellow-500 transition-colors ${
            isListening ? 'animate-pulse' : ''
          }`}
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
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </button>

        <form onSubmit={handleSendMessage} className="flex items-center gap-2 hidden">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="rounded-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-yellow-400"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            className="bg-yellow-400 p-3 rounded-full hover:bg-yellow-500 transition-colors"
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
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default HomePage;
