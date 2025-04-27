import React, { useState, useEffect, useRef } from 'react';
import chalkSoundSrc from '../assets/chalk-sound.mp3';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Chalkboard component that takes lines (array of objects) as prop
const Chalkboard = ({ lines = [] }) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chalkboardRef = useRef(null);
  const cursorRef = useRef(null);
  const audioRef = useRef(null); // Ref for the audio element
  
  // For handling LaTeX animation better
  const [lastAnimatedIdx, setLastAnimatedIdx] = useState(-1);
  const [isLatexLine, setIsLatexLine] = useState(false);
  const [shouldRenderFullLatex, setShouldRenderFullLatex] = useState(false);

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

  // Helper to check for LaTeX
  const isLatex = (text) => {
    // Matches \( ... \), $$ ... $$, \[ ... \], and $ ... $ (single dollar sign)
    return /\\\((.|\n)*?\\\)|\$\$(.|\n)*?\$\$|\\\[(.|\n)*?\\\]|\$([^\$\n]|\\\\)*\$/.test(text);
  };

  // Animate the last line only
  useEffect(() => {
    if (!lines.length) return;
    if (lastAnimatedIdx === lines.length - 1) return; // Already animated latest
    
    // Reset states for new animation
    setIsTyping(true);
    setShouldRenderFullLatex(false);
    
    let charIndex = 0;
    let currentText = '';
    
    // Get the text from the last line (handle both string and object formats)
    const lastLine = lines[lines.length - 1];
    const lastLineText = typeof lastLine === 'string' ? lastLine : lastLine.text || '';
    
    // Check if this line contains LaTeX
    const containsLatex = isLatex(lastLineText);
    setIsLatexLine(containsLatex);
    
    // Two animation options based on content type
    if (containsLatex) {
      // For LaTeX: Faster typing animation, then swap in rendered LaTeX at the end
      const typeLatexFast = () => {
        if (charIndex < lastLineText.length) {
          const char = lastLineText[charIndex];
          currentText += char;
          setDisplayText(currentText);
          charIndex++;
          // Faster animation for LaTeX, will be replaced with rendered version
          setTimeout(typeLatexFast, 10); 
        } else {
          // Animation complete - after a brief pause, mark as complete
          setTimeout(() => {
            setShouldRenderFullLatex(true);
            setIsTyping(false);
            setLastAnimatedIdx(lines.length - 1);
          }, 400);
        }
      };
      typeLatexFast();
    } else {
      // For regular text: Normal typing animation
      const typeRegularText = () => {
        if (charIndex < lastLineText.length) {
          const char = lastLineText[charIndex];
          currentText += char;
          setDisplayText(currentText);
          charIndex++;
          setTimeout(typeRegularText, Math.random() * 50 + 30);
        } else {
          setIsTyping(false);
          setLastAnimatedIdx(lines.length - 1);
        }
      };
      typeRegularText();
    }
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

  // Special handling for LaTeX rendering
  const renderLatexLine = (text) => {
    // Pattern for LaTeX delimiters
    const latexPattern = /(\\\((.|\n)*?\\\)|\$\$(.|\n)*?\$\$|\\\[(.|\n)*?\\\]|\$([^\$\n]|\\\\)*\$)/g;
    
    // Find all matches and their positions
    const matches = [];
    let match;
    while ((match = latexPattern.exec(text)) !== null) {
      matches.push({
        latex: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    // Build segments array with text and LaTeX parts
    const segments = [];
    let lastEnd = 0;
    
    matches.forEach(m => {
      // Add text before this LaTeX expression
      if (m.start > lastEnd) {
        segments.push({
          type: 'text',
          content: text.substring(lastEnd, m.start)
        });
      }
      
      // Add the LaTeX expression
      segments.push({
        type: 'latex',
        content: m.latex
      });
      
      lastEnd = m.end;
    });
    
    // Add any remaining text after the last LaTeX expression
    if (lastEnd < text.length) {
      segments.push({
        type: 'text',
        content: text.substring(lastEnd)
      });
    }
    
    // Render each segment accordingly
    return segments.map((seg, i) => {
      if (seg.type === 'latex') {
        try {
          // Remove delimiters for katex rendering
          let expr = seg.content;
          let displayMode = false;
          
          if (expr.startsWith('$$') && expr.endsWith('$$')) {
            expr = expr.slice(2, -2);
            displayMode = true;
          } else if (expr.startsWith('\\[') && expr.endsWith('\\]')) {
            expr = expr.slice(2, -2);
            displayMode = true;
          } else if (expr.startsWith('\\(') && expr.endsWith('\\)')) {
            expr = expr.slice(2, -2);
          } else if (expr.startsWith('$') && expr.endsWith('$')) {
            expr = expr.slice(1, -1);
          }
          
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ 
                __html: katex.renderToString(expr, { 
                  displayMode,
                  throwOnError: false,
                  errorColor: '#f44336'
                }) 
              }}
            />
          );
        } catch (e) {
          console.error('LaTeX rendering error:', e);
          return <span key={i} style={{ color: 'red' }}>{seg.content}</span>;
        }
      } else {
        // Handle newlines in text segments
        return (
          <span key={i}>
            {seg.content.split('\n').map((line, j) => (
              <React.Fragment key={j}>
                {line}
                {j < seg.content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      }
    });
  };

  // Helper to render text with LaTeX and newlines
  const renderLine = (text) => {
    if (isLatex(text)) {
      return renderLatexLine(text);
    } else {
      // No LaTeX, just handle newlines
      return text.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    }
  };

  // Get the current line being animated
  const getCurrentLine = () => {
    if (!lines.length) return null;
    const lastLine = lines[lines.length - 1];
    return typeof lastLine === 'string' ? lastLine : lastLine.text || '';
  };

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
      {/* Render all previous lines */}
      {lines.slice(0, -1).map((line, index) => {
        // Handle both string and object formats
        const lineText = typeof line === 'string' ? line : line.text || '';
        
        // Get position from the line object or default to 0
        const position = typeof line === 'object' ? line.position || {} : {};
        const left = position.left !== undefined ? position.left : 0;
        const top = position.top !== undefined ? position.top : 0;
        
        // Get color and font size from the line object or use defaults
        const color = typeof line === 'object' && line.color ? line.color : 'white';
        const fontSize = typeof line === 'object' && line.fontSize ? line.fontSize : 16;
        
        return (
          <div 
            key={index}
            style={{
              marginLeft: `${left}px`,
              marginTop: `${top}px`,
              color,
              fontSize: `${fontSize}px`,
              marginBottom: '8px'
            }}
          >
            {renderLine(lineText)}
          </div>
        );
      })}
      
      {/* Render the animated last line */}
      {lines.length > 0 && (
        <div
          style={{
            marginLeft: typeof lines[lines.length - 1] === 'object' && 
              lines[lines.length - 1].position && 
              lines[lines.length - 1].position.left !== undefined 
                ? `${lines[lines.length - 1].position.left}px` 
                : '0px',
            marginTop: typeof lines[lines.length - 1] === 'object' && 
              lines[lines.length - 1].position && 
              lines[lines.length - 1].position.top !== undefined 
                ? `${lines[lines.length - 1].position.top}px` 
                : '0px',
            color: typeof lines[lines.length - 1] === 'object' && lines[lines.length - 1].color 
              ? lines[lines.length - 1].color 
              : 'white',
            fontSize: typeof lines[lines.length - 1] === 'object' && lines[lines.length - 1].fontSize 
              ? `${lines[lines.length - 1].fontSize}px` 
              : '16px',
          }}
        >
          {/* Handle LaTeX differently during animation */}
          {isLatexLine && shouldRenderFullLatex ? (
            // Show fully rendered LaTeX once animation is complete
            renderLine(getCurrentLine())
          ) : (
            // Show character-by-character animation
            renderLine(displayText)
          )}
          
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
      )}
    </div>
  );
};

export default Chalkboard;