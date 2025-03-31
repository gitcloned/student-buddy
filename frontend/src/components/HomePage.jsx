import React, { useState, useEffect, useCallback, useRef } from "react";
import mascot from "../assets/mascot.webp";

const HomePage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2));
  const videoRef = useRef(null);
  const photoRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const streamRef = useRef(null); // To track and stop the stream

  const synthesis = window.speechSynthesis;

  const speakText = useCallback((text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.name === "Google हिन्दी");
    synthesis.cancel()
    synthesis.speak(utterance);
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000");
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      ws.send(JSON.stringify({ type: "session", sessionId }));
      setMessages([
        {
          type: "mascot",
          text: "Hi! I'm your study buddy. How can I help you today?",
        },
      ]);
      //speakText("Hi! I'm your study buddy. How can I help you today?")
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "text") {
        setMessages((prev) => [...prev, { type: "mascot", text: data.response }]);
        speakText(data.response);
      } else if (data.type === "action") {
        if (data.response === "take_photo") {
          // setMessages((prev) => [
          //   ...prev,
          //   { type: "system", text: "Please take a photo..." },
          // ]);
          setShowCamera(true);
        }
      } else if (data.type === "error") {
        console.error("Error:", data.message);
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
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handlePhotoCapture = (photoData) => {
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
  };

  const capturePhoto = () => {
    if (videoRef.current && photoRef.current) {
      const video = videoRef.current;
      const canvas = photoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoData = canvas.toDataURL("image/jpeg");
      handlePhotoCapture(photoData);
    }
  };

  // Camera initialization effect
  useEffect(() => {
    if (!showCamera || !videoRef.current) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      } catch (error) {
        console.error("Error accessing camera:", error);
        setMessages((prev) => [
          ...prev,
          { type: "system", text: "Camera access denied or unavailable." },
        ]);
      }
    };

    startCamera();

    // Cleanup function to stop the stream
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraReady(false);
    };
  }, [showCamera]);

  useEffect(() => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

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
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    window.recognition = recognition;
  }, [socket, sessionId]);

  const handleStartListening = () => {
    try {
      window.recognition.start();
      setIsListening(true);
      // setMessages((prev) => [
      //   ...prev,
      //   { type: "system", text: "Listening... Speak now." },
      // ]);
    } catch (error) {
      console.error("Error starting speech recognition:", error);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket) {
      const message = { type: "message", sessionId, text: inputMessage };
      socket.send(JSON.stringify(message));
      setMessages((prev) => [...prev, { type: "user", text: inputMessage }]);
      setInputMessage("");
    }
  };

  return (
    <div className="relative w-full h-full bg-white flex flex-row rounded-2xl">
      <div className="left-4 bottom-4 flex items-center w-[30vw]">
        <img src={mascot} alt="Study Buddy Mascot" className="w-[30vw] object-contain" />
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
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md w-full mx-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover rounded-lg bg-gray-100"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={photoRef} className="hidden" />
                {!isCameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-gray-500">Loading camera...</div>
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  onClick={capturePhoto}
                  disabled={!isCameraReady}
                  className={`bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-full text-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                    !isCameraReady ? "opacity-50 cursor-not-allowed" : ""
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
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Take Photo!
                </button>
                <button
                  onClick={() => setShowCamera(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-full text-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button
          onClick={handleStartListening}
          disabled={isListening}
          className={`bg-[#f0e6b0] p-3 rounded-full hover:bg-yellow-500 transition-colors ${
            isListening ? "animate-pulse" : ""
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