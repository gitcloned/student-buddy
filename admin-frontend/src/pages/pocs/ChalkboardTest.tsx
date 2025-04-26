import { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';

const ChalkboardTypingEffect = () => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const cursorRef = useRef(null);

  // Sample text with math equations
  const fullText = [
    "Welcome to our Math Class!",
    "",
    "Today we'll learn about quadratic equations:",
    "ax^2 + bx + c = 0",
    "",
    "The quadratic formula is:",
    "x = (-b ± √(b^2 - 4ac)) / (2a)",
    "",
    "Let's solve an example:",
    "3x^2 - 6x + 2 = 0",
    "",
    "Using the formula with a=3, b=-6, c=2:",
    "x = (6 ± √(36 - 24)) / 6",
    "x = (6 ± √12) / 6",
    "x = (6 ± 2√3) / 6",
    "x = 1 ± √3/3"
  ];

  // Sound effect for chalk writing
  const playChalkSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // 1. Create noise generator
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1; // White noise
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    // 2. Create filter for spectral shaping
    const bandpass = audioContext.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2000 + Math.random() * 2000; // Randomize frequency
    bandpass.Q.value = 1.5; // Quality factor

    // 3. Create dynamic gain envelope
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);

    // 4. Create occasional "scrape" highlights
    const lfo = audioContext.createOscillator();
    lfo.frequency.value = 40 + Math.random() * 30;
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 200 + Math.random() * 300;

    // Connect nodes
    noise.connect(bandpass);
    bandpass.connect(gainNode);
    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);
    gainNode.connect(audioContext.destination);

    // Start and stop
    noise.start();
    lfo.start();
    noise.stop(audioContext.currentTime + 0.15);
    lfo.stop(audioContext.currentTime + 0.15);
  };

  // Typing effect
  useEffect(() => {
    if (!isTyping) return;

    if (currentLineIndex < fullText.length) {
      const line = fullText[currentLineIndex];

      if (currentCharIndex < line.length) {
        const timer = setTimeout(() => {
          setDisplayText(prev => prev + line[currentCharIndex]);
          setCurrentCharIndex(prev => prev + 1);

          // Play chalk sound effect for non-space characters
          if (line[currentCharIndex] !== ' ') {
            playChalkSound();
          }
        }, Math.random() * 100 + 50); // Random typing speed for more natural effect

        return () => clearTimeout(timer);
      } else {
        // Move to next line
        const timer = setTimeout(() => {
          setDisplayText(prev => prev + '\n');
          setCurrentLineIndex(prev => prev + 1);
          setCurrentCharIndex(0);
        }, 500); // Pause at the end of line

        return () => clearTimeout(timer);
      }
    } else {
      setIsTyping(false);
    }
  }, [isTyping, currentLineIndex, currentCharIndex]);

  // Cursor blinking effect
  useEffect(() => {
    if (!isTyping) return;

    const interval = setInterval(() => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = cursorRef.current.style.opacity === '0' ? '1' : '0';
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isTyping]);

  // Restart typing effect
  const handleRestart = () => {
    setDisplayText('');
    setCurrentLineIndex(0);
    setCurrentCharIndex(0);
    setIsTyping(true);
  };

  // Function to render text with mathematical expressions
  const renderMathText = (text) => {
    return text.split('\n').map((line, index) => (
      <div key={index} className="chalk-line">
        {line}
      </div>
    ));
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-gray-800 w-full max-w-2xl p-8 rounded-lg shadow-lg relative overflow-hidden">
        {/* Chalk dust texture overlay */}
        <div className="absolute inset-0 bg-opacity-10 pointer-events-none">
          <div className="chalk-dust"></div>
        </div>

        {/* Chalkboard content */}
        <div className="font-chalk text-gray-100 whitespace-pre-wrap min-h-64 relative">
          {renderMathText(displayText)}
          {isTyping && (
            <span
              ref={cursorRef}
              className="inline-block h-6 w-2 bg-gray-100 align-text-bottom ml-1"
            ></span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6">
        <button
          onClick={handleRestart}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Restart Animation
        </button>
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        @font-face {
          font-family: 'ChalkFont';
          src: url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2') format('woff2');
        }
        
        .font-chalk {
          font-family: 'ChalkFont', 'Comic Sans MS', cursive;
          font-size: 1.5rem;
          line-height: 1.6;
          letter-spacing: 0.5px;
          text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.2);
        }
        
        .chalk-line {
          position: relative;
          margin-bottom: 0.5rem;
        }
        
        .chalk-dust {
          background-image: radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px);
          background-size: 6px 6px;
          width: 100%;
          height: 100%;
          opacity: 0.4;
        }
      `}</style>
    </div>
  );
};

export default ChalkboardTypingEffect;