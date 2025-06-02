import React from 'react';
import background from "../assets/classroom-background-2.jpg";
import { useChildrenData } from '../data/childrenData';

const ClassSelectionScreen = ({ onSelectChild }) => {
  // Use the hook to fetch children data
  const { children, loading, error } = useChildrenData();

  return (
    <div className="w-full h-full font-chalk">
      {/* Same background as HomePage */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70 z-0"
        style={{ backgroundImage: `url(${background})` }}
      />
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8">
        <div className="bg-[#fd9b9e] bg-transparent bg-opacity-40 rounded-xl p-8 shadow-xl max-w-4xl w-full">
          <h1 className="text-3xl font-bold text-center text-white mb-8">Pick Your Class</h1>
          
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#244d2b]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">Could not load children data. Please try again later.</span>
            </div>
          ) : children.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-white text-lg">No children found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child) => (
                <div 
                  key={child.id} 
                  className="bg-yellow-100 rounded-lg p-4 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => onSelectChild(child)}
                >
                  <div className="flex flex-col items-center">
                    <img 
                      src={child.avatar} 
                      alt={child.name}
                      className="w-24 h-24 rounded-full mb-3 border-4 border-yellow-300" 
                    />
                    <h3 className="text-xl font-semibold text-[#244d2b]">{child.name}</h3>
                    <p className="text-gray-500 text-sm">{child.grade}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassSelectionScreen;
