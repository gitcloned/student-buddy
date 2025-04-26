import React, { useState, useEffect, useRef } from 'react';

const Chalkboard = ({ content }) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const chalkboardRef = useRef(null);
  const cursorRef = useRef(null);

  // Sound effect for chalk writing
  const playChalkSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(Math.random() * 100 + 800, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  // Handle new content
  useEffect(() => {
    if (content && content !== displayText) {
      setIsTyping(true);
      const lines = content.split('\n');
      let currentText = displayText;
      let charIndex = 0;
      
      const typeNextChar = () => {
        if (charIndex < content.length) {
          const char = content[charIndex];
          currentText += char;
          setDisplayText(currentText);
          
          if (char !== ' ') {
            playChalkSound();
          }
          
          charIndex++;
          setTimeout(typeNextChar, Math.random() * 50 + 30);
        } else {
          setIsTyping(false);
        }
      };
      
      typeNextChar();
    }
  }, [content]);

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

  // Auto-scroll effect
  useEffect(() => {
    if (chalkboardRef.current) {
      chalkboardRef.current.scrollTop = chalkboardRef.current.scrollHeight;
    }
  }, [displayText]);

  return (
    <div 
      className="chalkboard"
      ref={chalkboardRef}
      style={{
        backgroundColor: '#2a623d',
        color: 'white',
        fontFamily: 'Chalk',
        padding: '20px',
        borderRadius: '10px',
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        fontSize: '18px',
        lineHeight: '1.5',
        position: 'relative'
      }}
    >
      {displayText}
      {isTyping && (
        <span 
          ref={cursorRef}
          style={{
            display: 'inline-block',
            width: '2px',
            height: '1.2em',
            backgroundColor: 'white',
            marginLeft: '2px',
            verticalAlign: 'middle'
          }}
        />
      )}
    </div>
  );
};

export default Chalkboard;
