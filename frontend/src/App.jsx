import React, { useState, useEffect } from 'react'
import './App.css'
import ReadingPage from './components/ReadingPage'
import HomePage from './components/HomePage'
import ClassSelectionScreen from './components/ClassSelectionScreen'
import SubjectSelectionScreen from './components/SubjectSelectionScreen'

function App() {
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [featureName, setFeatureName] = useState(null);
  
  // Import hooks for data fetching
  const [childrenData, setChildrenData] = useState([]);
  const [subjectsData, setSubjectsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Import the API service
        const apiServiceModule = await import('./services/apiService');
        const apiService = apiServiceModule.default;
        
        // Fetch children data
        const children = await apiService.getChildren();
        setChildrenData(children.map(child => ({
          id: child.id,
          name: child.name,
          grade: child.grade_id ? `${child.grade_id}${getGradeSuffix(child.grade_id)} Grade` : 'Unknown Grade',
          avatar: `https://api.dicebear.com/7.x/${child.id % 2 === 0 ? 'bottts' : 'adventurer'}/svg?seed=${child.name}`,
          bookIds: []
        })));
        
        // Fetch subjects data
        const subjects = await apiService.getSubjects();
        setSubjectsData(subjects.map(subject => ({
          id: subject.id,
          name: subject.name,
          icon: getSubjectIcon(subject.name),
          description: subject.description || generateDescription(subject.name, subject.grade_id),
          gradeId: subject.grade_id
        })));
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Fallback to hardcoded data
        import('./data/childrenData').then(module => {
          // Use the mock data as fallback
          const mockChildrenData = module.default;
          setChildrenData(mockChildrenData.length > 0 ? mockChildrenData : []);
        });
        
        import('./data/subjectsData').then(module => {
          // Use the mock data as fallback
          const mockSubjectsData = module.default;
          setSubjectsData(mockSubjectsData.length > 0 ? mockSubjectsData : []);
        });
      } finally {
        setIsLoading(false);
        
        // After data is loaded, check URL params
        checkUrlParams();
      }
    };
    
    fetchData();
  }, []);
  
  // Helper function to get grade suffix
  const getGradeSuffix = (grade) => {
    if (grade === 1) return 'st';
    if (grade === 2) return 'nd';
    if (grade === 3) return 'rd';
    return 'th';
  };
  
  // Helper function to get subject icon
  const getSubjectIcon = (subjectName) => {
    const name = subjectName.toLowerCase();
    if (name.includes('math')) return '📐';
    if (name.includes('english') || name.includes('language')) return '📚';
    if (name.includes('science')) return '🔬';
    return '📖'; // Default icon
  };
  
  // Helper function to generate description
  const generateDescription = (subjectName, gradeId) => {
    return `${subjectName} curriculum for grade ${gradeId || 'unknown'}`;
  };
  
  // Check for studentId in URL params
  const checkUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const studentIdParam = params.get('studentId');
    
    // Check for featureName parameter
    const featureNameParam = params.get('featureName');
    if (featureNameParam) {
      setFeatureName(featureNameParam);
    }
    
    if (studentIdParam && childrenData.length > 0) {
      const child = childrenData.find(c => c.id === parseInt(studentIdParam));
      if (child) {
        setSelectedChild(child);
        
        // Check if subjectId is also in URL params
        const subjectIdParam = params.get('subjectId');
        if (subjectIdParam && subjectsData.length > 0) {
          const subject = subjectsData.find(s => s.id === parseInt(subjectIdParam));
          if (subject) {
            setSelectedSubject(subject);
          }
        }
      }
    }
  };

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
        
        // Include chapterId in URL if available (for Chapter Teaching feature)
        if (selectedSubject.chapterId) {
          params.set('chapterId', selectedSubject.chapterId);
        } else if (selectedSubject.selectedChapter) {
          params.set('chapterId', selectedSubject.selectedChapter.id);
        }
      }
      
      // Include featureName if it exists
      if (featureName) {
        params.set('featureName', featureName);
      }
      
      // Update the URL without refreshing the page
      window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    }
  }, [selectedChild, selectedSubject, featureName]);

  // Determine which screen to show
  const renderScreen = () => {
    // Show loading spinner while data is being fetched
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      );
    }
    
    // Show appropriate screen based on selection state
    if (!selectedChild) {
      return <ClassSelectionScreen onSelectChild={handleSelectChild} />;
    } else if (!selectedSubject) {
      return <SubjectSelectionScreen 
               selectedChild={selectedChild}
               onSelectSubject={handleSelectSubject}
               gradeId={selectedChild.grade_id || parseInt(selectedChild.grade)} // Handle both API and mock data formats
               featureName={featureName} // Pass featureName prop
             />;
    } else {
      return <HomePage 
               studentId={selectedChild.id}
               subjectId={selectedSubject.id}
               childData={selectedChild}
               subjectData={selectedSubject}
               featureName={featureName}
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
