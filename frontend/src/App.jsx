import React, { useState, useEffect } from 'react'
import './App.css'
import ReadingPage from './components/ReadingPage'
import HomePage from './components/HomePage'
import ClassSelectionScreen from './components/ClassSelectionScreen'
import SubjectSelectionScreen from './components/SubjectSelectionScreen'

function App() {
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  
  // Check for studentId in URL params on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const studentIdParam = params.get('studentId');
    
    if (studentIdParam) {
      // Find the child with matching ID from childrenData
      // For demo purposes, we're not making an actual API call here
      import('./data/childrenData').then(module => {
        const childrenData = module.default;
        const child = childrenData.find(c => c.id === parseInt(studentIdParam));
        if (child) {
          setSelectedChild(child);
          
          // Check if subjectId is also in URL params
          const subjectIdParam = params.get('subjectId');
          if (subjectIdParam) {
            import('./data/subjectsData').then(module => {
              const subjectsData = module.default;
              const subject = subjectsData.find(s => s.id === parseInt(subjectIdParam));
              if (subject) {
                setSelectedSubject(subject);
              }
            });
          }
        }
      });
    }
  }, []);

  const handleSelectChild = (child) => {
    setSelectedChild(child);
    setSelectedSubject(null); // Reset subject when changing child
  };

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
  };

  // Update URL with selected IDs
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedChild) {
      params.set('studentId', selectedChild.id);
      
      if (selectedSubject) {
        params.set('subjectId', selectedSubject.id);
      }
      
      // Update the URL without refreshing the page
      window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    }
  }, [selectedChild, selectedSubject]);

  // Determine which screen to show
  const renderScreen = () => {
    if (!selectedChild) {
      return <ClassSelectionScreen onSelectChild={handleSelectChild} />;
    } else if (!selectedSubject) {
      return <SubjectSelectionScreen 
               selectedChild={selectedChild} 
               onSelectSubject={handleSelectSubject} 
             />;
    } else {
      return <HomePage 
               studentId={selectedChild.id} 
               subjectId={selectedSubject.id} 
             />;
    }
  };

  return (
    <div className="bg-white w-full h-full">
      {renderScreen()}
    </div>
  )
}

export default App
