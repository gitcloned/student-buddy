import React, { useState, useEffect, useRef } from 'react';
import chalkSoundSrc from '../assets/chalk-sound.mp3';

// Chalkboard now takes lines (array) as prop
const Chalkboard = ({ lines = [] }) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chalkboardRef = useRef(null);
  const cursorRef = useRef(null);
  const audioRef = useRef(null); // Ref for the audio element

  // Track the last animated line index
  const [lastAnimatedIdx, setLastAnimatedIdx] = useState(-1);

  // Initialize audio on mount
  useEffect(() => {
    audioRef.current = new window.Audio(chalkSoundSrc);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play or pause chalk sound based on typing
  useEffect(() => {
    if (isTyping && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (!isTyping && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isTyping]);

  // Animate the last line only
  useEffect(() => {
    if (!lines.length) return;
    if (lastAnimatedIdx === lines.length - 1) return; // Already animated latest
    setIsTyping(true);
    let charIndex = 0;
    let currentText = '';
    const lastLine = lines[lines.length - 1] || '';

    const typeNextChar = () => {
      if (charIndex < lastLine.length) {
        const char = lastLine[charIndex];
        currentText += char;
        setDisplayText(currentText);
        charIndex++;
        setTimeout(typeNextChar, Math.random() * 50 + 30);
      } else {
        setIsTyping(false);
        setLastAnimatedIdx(lines.length - 1);
      }
    };

    setDisplayText('');
    typeNextChar();
  }, [lines]);

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
  }, [displayText, lines]);

  // Render all previous lines and the animated last line
  return (
    <div 
      className="chalkboard font-chalk"
      ref={chalkboardRef}
      style={{
        backgroundColor: '#2a623d',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        lineHeight: '1.5',
        position: 'relative'
      }}
    >
      {lines.slice(0, -1).join('\n')}
      {lines.length > 1 ? '\n' : ''}
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
