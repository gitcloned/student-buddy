import React, { useState, useEffect } from 'react';
import background from "../assets/classroom-background-2.jpg";
import { useSubjectsByGradeId } from '../data/subjectsData';
import { useChaptersBySubjectId } from '../data/chaptersData';

const SubjectSelectionScreen = ({ selectedChild, onSelectSubject, gradeId, featureName }) => {
  // Get subjects for the selected child's grade using the hook
  const gradeIdToUse = gradeId || parseInt(selectedChild.grade);
  const { subjects: availableSubjects, loading, error } = useSubjectsByGradeId(gradeIdToUse);
  
  // State for selected subject (for chapter selection)
  const [selectedSubjectForChapters, setSelectedSubjectForChapters] = useState(null);
  
  // Determine if we need to show chapters (when feature is Chapter Teaching)
  const isChapterTeachingFeature = featureName && featureName.toLowerCase().includes('chapter teaching');
  
  // Fetch chapters when a subject is selected and feature is Chapter Teaching
  const { chapters, loading: chaptersLoading, error: chaptersError } = 
    useChaptersBySubjectId(selectedSubjectForChapters?.id);
  
  // Check URL params for feature name
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const featureParam = params.get('featureName');
    
    if (featureParam && featureParam.toLowerCase().includes('chapter teaching')) {
      // We're in Chapter Teaching mode
    }
  }, []);
  
  // Handle subject selection
  const handleSubjectSelect = (subject) => {
    if (isChapterTeachingFeature) {
      // If Chapter Teaching feature, show chapters for this subject
      setSelectedSubjectForChapters(subject);
    } else {
      // Otherwise, proceed with normal subject selection
      onSelectSubject(subject);
    }
  };
  
  // Handle chapter selection
  const handleChapterSelect = (chapter) => {
    // Add chapter to the subject and pass it up
    const subjectWithChapter = {
      ...selectedSubjectForChapters,
      selectedChapter: chapter
    };
    onSelectSubject(subjectWithChapter);
  };
  
  // Go back to subject selection
  const handleBackToSubjects = () => {
    setSelectedSubjectForChapters(null);
  };

  return (
    <div className="w-full h-full font-chalk">
      {/* Same background as HomePage */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70 z-0"
        style={{ backgroundImage: `url(${background})` }}
      />
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8">
        <div className="bg-[#fd9b9e] bg-transparent bg-opacity-40 rounded-xl p-8 shadow-xl max-w-4xl w-full">
          {selectedSubjectForChapters ? (
            // Chapter selection screen
            <>
              <div className="flex justify-between items-center mb-6">
                <button 
                  onClick={handleBackToSubjects}
                  className="bg-[#244d2b] text-white px-4 py-2 rounded-lg hover:bg-[#1a3a1f] transition-colors"
                >
                  ← Back to Subjects
                </button>
                <h1 className="text-2xl font-bold text-white">
                  {selectedSubjectForChapters.name} Chapters
                </h1>
              </div>
              
              <h2 className="text-xl font-semibold text-center text-white mb-6">
                Which chapter would you like to study?
              </h2>
              
              {chaptersLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#244d2b]"></div>
                </div>
              ) : chaptersError ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">Could not load chapters. Please try again later.</span>
                </div>
              ) : chapters.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-white text-lg">No chapters found for this subject.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {chapters.map((chapter) => (
                    <div 
                      key={chapter.id} 
                      className="bg-yellow-100 rounded-lg p-6 shadow-md hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => handleChapterSelect(chapter)}
                    >
                      <div className="flex flex-col items-center">
                        <div className="text-4xl mb-3">📖</div>
                        <h3 className="text-xl font-semibold text-[#244d2b]">{chapter.name}</h3>
                        <p className="text-gray-600 text-sm text-center mt-2">{chapter.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Subject selection screen
            <>
              <h1 className="text-3xl font-bold text-center text-white mb-4">Hello, {selectedChild.name}!</h1>
              <h2 className="text-2xl font-semibold text-center text-white mb-8">
                {isChapterTeachingFeature 
                  ? 'Select a subject to see chapters' 
                  : 'What would you like to learn today?'}
              </h2>
              
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#244d2b]"></div>
                </div>
              ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">Could not load subjects. Please try again later.</span>
                </div>
              ) : availableSubjects.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-white text-lg">No subjects found for your grade level.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableSubjects.map((subject) => (
                    <div 
                      key={subject.id} 
                      className="bg-yellow-100 rounded-lg p-6 shadow-md hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => handleSubjectSelect(subject)}
                    >
                      <div className="flex flex-col items-center">
                        <div className="text-4xl mb-3">{subject.icon}</div>
                        <h3 className="text-xl font-semibold text-[#244d2b]">{subject.name}</h3>
                        <p className="text-gray-600 text-sm text-center mt-2">{subject.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectSelectionScreen;
