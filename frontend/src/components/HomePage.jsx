import React, { useState, useEffect, useCallback, useRef } from "react";
import mascot from "../assets/mascot.webp";
import Teacher from "../assets/teacher.svg";
import TeacherSmiling from "../assets/teacher-smiling.svg";
import background from "../assets/classroom-background-2.jpg";
import dropSound from "../assets/drop_sound.mp3";
import CameraComponent from "./CameraComponent";
import Chalkboard from "./Chalkboard";
import Session from "../models/Session";
import { generateGreeting } from "../utils/generateGreeting";

const HomePage = ({ studentId, subjectId, childData, subjectData, featureName: propFeatureName }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [chalkboardLines, setChalkboardLines] = useState([]);
  const [session, setSession] = useState(null);
  const [isWaitingForReply, setIsWaitingForReply] = useState(false);
  const chatContainerRef = useRef(null);
  const audioRef = useRef(new Audio(dropSound));
  const audioPlayerRef = useRef(null);
  const hasInitialized = useRef(false);

  const synthesis = window.speechSynthesis;

  const speakText = useCallback((text, ws) => {
    ws.send(
      JSON.stringify({
        type: "generate-audio",
        text,
      })
    );
  }, []);

  // Extract feature name and chapter ID from props, URL params, or subject data
  const [featureName, setFeatureName] = useState(propFeatureName || null);
  const [chapterId, setChapterId] = useState(null);

  // Check props and URL params for feature name
  useEffect(() => {
    // If feature name is provided as prop, use it
    if (propFeatureName) {
      setFeatureName(propFeatureName);
    } else {
      // Otherwise check URL params
      const params = new URLSearchParams(window.location.search);
      const featureParam = params.get('featureName');
      
      if (featureParam) {
        setFeatureName(featureParam);
      }
    }
    
    // If subject has a selected chapter (from Chapter Teaching feature)
    if (subjectData && subjectData.selectedChapter) {
      setChapterId(subjectData.selectedChapter.id);
    }
  }, [propFeatureName, subjectData]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    async function initializeSession() {
      try {
        const createdSession = await Session.create(studentId, subjectId, featureName, chapterId);
        setSession(createdSession);
        const ws = new WebSocket("ws://localhost:8000");
        setSocket(ws);

        ws.onopen = () => {
          console.log("WebSocket connection established");
          ws.send(
            JSON.stringify({
              type: "session",
              sessionId: createdSession.sessionId,
              studentId: createdSession.studentId,
              subjectId: createdSession.subjectId,
              featureName: createdSession.featureName,
              chapterId: createdSession.chapterId
            })
          );
          // setMessages([
          //   {
          //     type: "mascot",
          //     text: "Hi! I'm your study buddy. How can I help you today?",
          //   },
          // ]);
          // speakText("Hi! I'm your study buddy. How can I help you today?");
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);

          console.log(data);

          if (data.type === "session-created") {
            const greeting = generateGreeting("", { 
              teacherLanguage: data.session._teacherPersona.language, 
              teacherStyle: data.session._teacherPersona.tone
            });
            setMessages((prev) => [...prev, { 
              type: "mascot", 
              text: greeting
            }]);
            speakText(greeting, ws);
          }

          if (data.type === "text") {
            setIsWaitingForReply(false);
            setMessages((prev) => [...prev, { type: "mascot", text: data.speak }]);
            if (!data.audio) speakText(data.speak, ws);
          } else if (data.type === "action") {
            setIsWaitingForReply(false);
            if (data.action === "take_photo") {
              setMessages((prev) => [...prev, { type: "mascot", text: data.speak }]);
              if (!data.audio) speakText(data.speak, ws);
              setShowCamera(true);
            }
          } else if (data.type === "error") {
            setIsWaitingForReply(false);
            console.error("Error:", data.message);
          }

          if (data.type === "audio" || data.audio) {
            if (audioPlayerRef.current) {
              try {
                // Convert the Buffer (array of bytes) to a Blob
                const audioBlob = new Blob([new Uint8Array(data.audio.data)], {
                  type: "audio/mpeg",
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

          // Chalkboard: accumulate lines
          if (data.write) {
            // Helper functions for randomization
            const getRandomOffset = () => Math.floor(Math.random() * 6) - 2; // Random value between -2 and 4
            const getRandomFontSize = (baseFontSize = 22) => {
              // Small variation: between 0.9 and 1.1 times the base size
              const variation = 0.95 + (Math.random() * 0.1);
              return Math.floor(baseFontSize * variation);
            };
            
            // Convert string format to object format with text attribute
            let chalkLine;
            if (typeof data.write === 'string') {
              // Create object with random position and fontSize
              chalkLine = { 
                text: data.write, 
                position: { 
                  left: getRandomOffset(), 
                  top: getRandomOffset() 
                },
                fontSize: getRandomFontSize()
              };
            } else {
              // Already in object format, ensure position is set
              chalkLine = { ...data.write };
              if (!chalkLine.position) {
                chalkLine.position = { 
                  left: getRandomOffset(), 
                  top: getRandomOffset() 
                };
              }
              if (!chalkLine.fontSize) {
                chalkLine.fontSize = getRandomFontSize(chalkLine.fontSize || 22);
              }
            }
              
            setChalkboardLines((prev) => [...prev, chalkLine]);
          }

        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsWaitingForReply(false);
          setMessages((prev) => [
            ...prev,
            { type: "system", text: "Connection error. Please try again." },
          ]);
        };

        return () => ws.close();
      } catch (e) {
        console.error("Session initialization failed", e);
        setIsWaitingForReply(false);
      }
    }
    initializeSession();
  }, [studentId, subjectId, featureName, chapterId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isWaitingForReply]);

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
        setIsWaitingForReply(true);
        socket.send(
          JSON.stringify({
            type: "message",
            sessionId: session.sessionId,
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
  }, [socket, session]);

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
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70 z-0"
        style={{ backgroundImage: `url(${background})` }}
      />
      <div className="relative z-10 w-full h-full p-4">
        <div className="relative w-full h-full flex flex-row rounded-2xl justify-end">
          <audio ref={audioPlayerRef} hidden />

          {/* Chalkboard Section */}
          {chalkboardLines.length > 0 && (
            // make it full width if smaller screen
            <div className="flex-grow h-full relative md:block">
              <Chalkboard lines={chalkboardLines} />
            </div>
          )}

          {/* Mascot and Chat Section */}
          <div className={`${chalkboardLines.length > 0 ? 'w-[40%]' : 'w-full'} flex flex-row max-w-[60%]`}>

            <div className="flex-grow mb-18 p-4">
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 h-full"
              >
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"
                        }`}
                    >
                      <div
                        className={`rounded-lg p-3 max-w-[80%] ${message.type === "user"
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
                  
                  {/* Loading indicator with speech bubble and three dots */}
                  {isWaitingForReply && (
                    <div className="flex justify-start">
                      <div className="rounded-lg p-3 bg-[#fd9b9e] text-[#244d2b] max-w-[80%]">
                        <div className="flex space-x-1 items-center">
                          <div className="w-2 h-2 bg-[#244d2b] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-[#244d2b] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          <div className="w-2 h-2 bg-[#244d2b] rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {showCamera && (
                <CameraComponent
                  onCapture={(photoData) => {
                    if (socket) {
                      socket.send(
                        JSON.stringify({
                          type: "photo",
                          sessionId: session.sessionId,
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

            <div className="flex flex-col w-full mb-4 hidden">
              <h1 className="text-3xl font-bold text-white mb-4">
                {subjectData ? subjectData.name : "Subject"}
              </h1>
              
              {/* Display chapter information if available */}
              {subjectData && subjectData.selectedChapter && (
                <div className="bg-yellow-100 rounded-lg p-4 mb-4 shadow-md">
                  <h2 className="text-xl font-semibold text-[#244d2b] mb-2">
                    Chapter: {subjectData.selectedChapter.name}
                  </h2>
                  <p className="text-gray-700 text-sm">
                    {subjectData.selectedChapter.description}
                  </p>
                </div>
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
                        setIsWaitingForReply(true);
                        socket.send(
                          JSON.stringify({
                            type: "message",
                            sessionId: session.sessionId,
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
                  className={`p-4 rounded-full shadow-lg ${isListening ? "bg-yellow-500" : "bg-yellow-500"
                    } text-white ${isPulsing ? "animate-pulse ring-4 ring-yellow-300" : ""
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

          <div className={`absolute flex items-center ${
            chalkboardLines.length > 0 
              ? "left-0 bottom-0 z-20" 
              : "left-0 bottom-0 w-[30vw] mt-30"
          }`}>
            <img
              src={Teacher}
              alt="Study Buddy Mascot"
              className={`${
                chalkboardLines.length > 0 
                  ? "w-[120px] h-[120px]" 
                  : "w-[30vw]"
              } object-contain transition-all duration-300`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
