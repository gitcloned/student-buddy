import React from 'react';
import background from "../assets/classroom-background-2.jpg";
import subjectsData from '../data/subjectsData';

const SubjectSelectionScreen = ({ selectedChild, onSelectSubject }) => {
  // Filter subjects for the selected child's grade
  const gradeId = parseInt(selectedChild.id); // Using child ID as grade ID for this example
  const availableSubjects = subjectsData.filter(subject => subject.gradeId === gradeId);

  return (
    <div className="w-full h-full font-chalk">
      {/* Same background as HomePage */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70 z-0"
        style={{ backgroundImage: `url(${background})` }}
      />
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8">
        <div className="bg-[#fd9b9e] bg-transparent bg-opacity-40 rounded-xl p-8 shadow-xl max-w-4xl w-full">
          <h1 className="text-3xl font-bold text-center text-white mb-4">Hello, {selectedChild.name}!</h1>
          <h2 className="text-2xl font-semibold text-center text-white mb-8">What would you like to learn today?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableSubjects.map((subject) => (
              <div 
                key={subject.id} 
                className="bg-yellow-100 rounded-lg p-6 shadow-md hover:shadow-lg transition-all cursor-pointer"
                onClick={() => onSelectSubject(subject)}
              >
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-3">{subject.icon}</div>
                  <h3 className="text-xl font-semibold text-[#244d2b]">{subject.name}</h3>
                  <p className="text-gray-600 text-sm text-center mt-2">{subject.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectSelectionScreen;
