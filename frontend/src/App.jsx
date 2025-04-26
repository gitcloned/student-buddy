import React, { useState } from 'react'
import './App.css'
import ReadingPage from './components/ReadingPage'
import HomePage from './components/HomePage'
import ClassSelectionScreen from './components/ClassSelectionScreen'

function App() {
  const [selectedChild, setSelectedChild] = useState(null);

  const handleSelectChild = (child) => {
    setSelectedChild(child);
  };

  return (
    <div className="bg-white w-full h-full">
      {selectedChild ? (
        <HomePage grade={selectedChild.grade} bookIds={selectedChild.bookIds} />
      ) : (
        <ClassSelectionScreen onSelectChild={handleSelectChild} />
      )}
    </div>
  )
}

export default App
