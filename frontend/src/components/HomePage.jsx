import React, { useState, useEffect, useCallback, useRef } from "react";
import mascot from "../assets/mascot.webp";
import background from "../assets/background.avif";
import dropSound from "../assets/drop_sound.mp3";
import CameraComponent from "./CameraComponent";

const HomePage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2));
  const chatContainerRef = useRef(null);
  const audioRef = useRef(new Audio(dropSound));
  const audioPlayerRef = useRef(null);

  const synthesis = window.speechSynthesis;

  const speakText = useCallback((text, ws) => {
    // const utterance = new SpeechSynthesisUtterance(text);
    // const voices = synthesis.getVoices();
    // utterance.voice = voices.find((voice) => voice.name === "Google हिन्दी");
    // synthesis.cancel();
    // synthesis.speak(utterance);

    ws.send(
      JSON.stringify({
        type: "generate-audio",
        text,
      })
    );
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000");
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      ws.send(
        JSON.stringify({
          type: "session",
          sessionId,
          grade: "1st Grade",
          bookIds: [1, 2, 3],
        })
      );
      setMessages([
        {
          type: "mascot",
          text: "Hi! I'm your study buddy. How can I help you today?",
        },
      ]);
      // speakText("Hi! I'm your study buddy. How can I help you today?");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      console.log(data);

      if (data.type === "text") {
        setMessages((prev) => [...prev, { type: "mascot", text: data.text }]);
        if (!data.audio) speakText(data.text, ws);
      } else if (data.type === "action") {
        if (data.action === "take_photo") {
          setMessages((prev) => [...prev, { type: "mascot", text: data.text }]);
          if (!data.audio) speakText(data.text, ws);
          setShowCamera(true);
        }
      } else if (data.type === "error") {
        console.error("Error:", data.message);
      }

      if (data.type === "audio" || data.audio) {
        if (audioPlayerRef.current) {
          try {
            // Convert the Buffer (array of bytes) to a Blob
            const audioBlob = new Blob([new Uint8Array(data.audio.data)], {
              type: "audio/mp3",
            });
            // Create a URL for the Blob
            const audioUrl = URL.createObjectURL(audioBlob);
            // Set the audio element's src to the Blob URL
            audioPlayerRef.current.src = audioUrl;

            // Play the audio
            audioPlayerRef.current
              .play()
              .then(() => console.log("Audio playing successfully"))
              .catch((error) => {
                console.error("Audio playback error:", error);
                setMessages((prev) => [
                  ...prev,
                  {
                    type: "system",
                    text: "Error playing audio",
                  },
                ]);
              });

            // Clean up the Blob URL when the audio finishes playing
            audioPlayerRef.current.onended = () => {
              URL.revokeObjectURL(audioUrl);
            };
          } catch (error) {
            console.error("Audio setup error:", error);
            setMessages((prev) => [
              ...prev,
              {
                type: "system",
                text: "Error setting up audio",
              },
            ]);
          }
        }
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setMessages((prev) => [
        ...prev,
        { type: "system", text: "Connection error. Please try again." },
      ]);
    };

    return () => ws.close();
  }, [sessionId, speakText]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setMessages((prev) => [...prev, { type: "user", text: speechResult }]);
      if (socket) {
        socket.send(
          JSON.stringify({
            type: "message",
            sessionId,
            text: speechResult,
          })
        );
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setIsPulsing(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsPulsing(false);
    };

    window.recognition = recognition;
  }, [socket, sessionId]);

  const handleStartListening = (e) => {
    try {
      e.preventDefault();
      e.stopPropagation();

      window.recognition.start();
      setIsListening(true);
      setIsPulsing(true);
    } catch (error) {
      console.error("Error starting speech recognition:", error);
    }
  };

  const handleStopListening = (e) => {
    try {
      e.preventDefault();
      e.stopPropagation();

      window.recognition.stop();
      setIsListening(false);
      setIsPulsing(false);
      audioRef.current.play();
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
    }
  };

  return (
    <div className="w-full h-full">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 z-0"
        style={{ backgroundImage: `url(${background})` }}
      />
      <div className="relative z-10 w-full h-full">
        <div className="relative w-full h-full flex flex-row rounded-2xl">
          <audio ref={audioPlayerRef} hidden />
          <div className="left-4 bottom-4 flex items-center w-[30vw] mt-30">
            <img
              src={mascot}
              alt="Study Buddy Mascot"
              className="w-[30vw] object-contain"
            />
          </div>

          <div className="flex-grow mb-18 p-4">
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 h-full"
            >
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-lg p-3 max-w-[80%] ${
                        message.type === "user"
                          ? "bg-yellow-200"
                          : message.type === "system"
                          ? "bg-gray-200"
                          : "bg-[#fd9b9e] text-[#244d2b]"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showCamera && (
              <CameraComponent
                onCapture={(photoData) => {
                  if (socket) {
                    socket.send(
                      JSON.stringify({
                        type: "photo",
                        sessionId,
                        data: photoData,
                      })
                    );
                    setShowCamera(false);
                    setMessages((prev) => [
                      ...prev,
                      { type: "user", text: "Photo sent successfully" },
                    ]);
                  }
                }}
                onClose={() => setShowCamera(false)}
              />
            )}
          </div>

          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <div className="flex items-center gap-2 mt-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputMessage.trim()) {
                    setMessages((prev) => [
                      ...prev,
                      { type: "user", text: inputMessage },
                    ]);
                    if (socket) {
                      socket.send(
                        JSON.stringify({
                          type: "message",
                          sessionId,
                          text: inputMessage,
                        })
                      );
                    }
                    setInputMessage(""); // Clear the input after sending
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 bg-white"
              />
              <button
                onClick={() => {
                  setShowCamera(true);
                }}
                className={`bg-yellow-500 shadow-lg p-4 rounded-full pointer`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="#244d2b"
                  className="w-8 h-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <button
                onMouseDown={handleStartListening}
                onMouseUp={handleStopListening}
                onMouseLeave={handleStopListening}
                onTouchStart={handleStartListening}
                onTouchEnd={handleStopListening}
                className={`p-4 rounded-full shadow-lg ${
                  isListening ? "bg-yellow-500" : "bg-yellow-500"
                } text-white ${
                  isPulsing ? "animate-pulse ring-4 ring-yellow-300" : ""
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="#244d2b"
                  className="w-8 h-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
