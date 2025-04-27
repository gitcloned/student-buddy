import React, { useState } from 'react';
import Chalkboard from './components/Chalkboard';

const sampleLines = [
  { text: 'Welcome to the Chalkboard test!' },
  { text: 'This line is rendered with animation.' },
  { text: 'You can add math: $E=mc^2$' },
  { text: 'Try editing the lines below.' }
];

const ChalkboardTestPage = () => {
  const [lines, setLines] = useState(sampleLines);
  const [input, setInput] = useState('');

  const handleAddLine = () => {
    if (input.trim()) {
      setLines([...lines, { text: input }]);
      setInput('');
    }
  };

  return (
    <div style={{ padding: 32, background: '#222', minHeight: '100vh', color: '#fff' }}>
      <h1>Chalkboard Component Test</h1>
      <Chalkboard lines={lines} />
      <div style={{ marginTop: 24 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a new line..."
          style={{ padding: 8, width: 300, marginRight: 8 }}
        />
        <button onClick={handleAddLine} style={{ padding: '8px 16px' }}>
          Add Line
        </button>
      </div>
    </div>
  );
};

export default ChalkboardTestPage;
