import React from 'react';

const ReadingPage = () => {
  return (
    <div className="max-w-2xl w-full h-full mx-auto p-4 bg-white rounded-lg shadow-lg" h-full w-full>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Pete's Trick</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < 8 ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-yellow-500 font-bold">★ 103</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '65%' }} />
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="prose">
          <p className="text-lg">
            This is Dan. Dan is a fine dog, but he does like to chase Pete. Pete lives in a big pine.
          </p>
        </div>
        <div className="rounded-lg overflow-hidden">
          <img
            src="/path-to-your-image.jpg"
            alt="A yellow dog looking up at a tree"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ReadingPage;
