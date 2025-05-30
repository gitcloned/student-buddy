import React, { useState, useEffect } from 'react';
import { childrenApi, chaptersApi, subjectsApi, LearningProgression } from '../services/api';

const LearningProgressionPage: React.FC = () => {
  const [children, setChildren] = useState<{ id: number; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [chapters, setChapters] = useState<{ id: number; name: string }[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | ''>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [selectedChapterId, setSelectedChapterId] = useState<number | ''>('');
  const [progression, setProgression] = useState<LearningProgression | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch children on component mount
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const childrenData = await childrenApi.getAll();
        setChildren(childrenData.map(child => ({ id: child.id!, name: child.name })));
      } catch (err) {
        setError('Error fetching children');
        console.error(err);
      }
    };

    fetchChildren();
  }, []);
  
  // Fetch subjects when a child is selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedChildId) {
        setSubjects([]);
        return;
      }
      
      try {
        const subjectsData = await childrenApi.getSubjects(Number(selectedChildId));
        setSubjects(subjectsData.map(subject => ({ id: subject.id!, name: subject.name })));
        // Reset subject and chapter selection when child changes
        setSelectedSubjectId('');
        setSelectedChapterId('');
      } catch (err) {
        setError('Error fetching subjects');
        console.error(err);
      }
    };

    fetchSubjects();
  }, [selectedChildId]);
  
  // Fetch chapters when a subject is selected
  useEffect(() => {
    const fetchChapters = async () => {
      if (!selectedSubjectId) {
        setChapters([]);
        return;
      }
      
      try {
        const chaptersData = await chaptersApi.getBySubject(Number(selectedSubjectId));
        setChapters(chaptersData.map(chapter => ({ id: chapter.id!, name: chapter.name })));
        // Reset chapter selection when subject changes
        setSelectedChapterId('');
      } catch (err) {
        setError('Error fetching chapters');
        console.error(err);
      }
    };

    fetchChapters();
  }, [selectedSubjectId]);

  // Handle child selection change
  const handleChildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const childId = e.target.value ? Number(e.target.value) : '';
    setSelectedChildId(childId);
    setSelectedSubjectId(''); // Reset subject selection
    setSelectedChapterId(''); // Reset chapter selection
    setProgression(null); // Reset progression data
  };

  // Handle subject selection change
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectId = e.target.value ? Number(e.target.value) : '';
    setSelectedSubjectId(subjectId);
    setSelectedChapterId(''); // Reset chapter selection
    setProgression(null); // Reset progression data
  };

  // Handle chapter selection change
  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chapterId = e.target.value ? Number(e.target.value) : '';
    setSelectedChapterId(chapterId);
  };

  // Fetch learning progression data
  const fetchLearningProgression = async () => {
    if (!selectedChildId || !selectedSubjectId || !selectedChapterId) {
      setError('Please select a child, subject, and chapter');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await childrenApi.getLearningProgression(
        Number(selectedChildId),
        Number(selectedChapterId)
      );
      setProgression(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching learning progression');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Render learning state with appropriate color
  const renderLearningState = (state: string | null) => {
    if (!state) return <span className="text-gray-400">Not set</span>;
    
    const stateColors: Record<string, string> = {
      'assess': 'bg-yellow-100 text-yellow-800',
      'teach': 'bg-blue-100 text-blue-800',
      'taught': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stateColors[state] || 'bg-gray-100'}`}>
        {state}
      </span>
    );
  };

  // Render learning level with appropriate color
  const renderLearningLevel = (level: string | null) => {
    if (!level) return <span className="text-gray-400">Not set</span>;
    
    const levelColors: Record<string, string> = {
      'Weak': 'bg-red-100 text-red-800',
      'Average': 'bg-yellow-100 text-yellow-800',
      'Strong': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors[level] || 'bg-gray-100'}`}>
        {level}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Learning Progression</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Child
            </label>
            <select
              className="w-full border border-gray-300 rounded-md py-2 px-3"
              value={selectedChildId}
              onChange={handleChildChange}
            >
              <option value="">-- Select a child --</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Subject
            </label>
            <select
              className="w-full border border-gray-300 rounded-md py-2 px-3"
              value={selectedSubjectId}
              onChange={handleSubjectChange}
              disabled={!selectedChildId}
            >
              <option value="">-- Select a subject --</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Chapter
            </label>
            <select
              className="w-full border border-gray-300 rounded-md py-2 px-3"
              value={selectedChapterId}
              onChange={handleChapterChange}
              disabled={!selectedSubjectId}
            >
              <option value="">-- Select a chapter --</option>
              {chapters.map(chapter => (
                <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          onClick={fetchLearningProgression}
          disabled={!selectedChildId || !selectedSubjectId || !selectedChapterId || loading}
        >
          {loading ? 'Loading...' : 'View Learning Progression'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {progression && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {progression.childName}'s Learning Progression
            </h2>
            <p className="text-gray-600">
              Chapter: {progression.chapterName} | Subject: {progression.subjectName}
            </p>
          </div>
          
          {progression.topics.map(topic => (
            <div key={topic.topicId} className="mb-8 border-b pb-6">
              <h3 className="text-lg font-medium mb-4">{topic.topicName}</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Learning Indicator
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        State
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Evaluated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topic.learningIndicators.map(indicator => (
                      <tr key={indicator.id}>
                        <td className="px-4 py-4 whitespace-normal">
                          <div className="text-sm font-medium text-gray-900">{indicator.title}</div>
                          {indicator.commonMisconception && (
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="font-medium">Common misconception:</span> {indicator.commonMisconception}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {renderLearningState(indicator.state)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {renderLearningLevel(indicator.level)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {indicator.lastEvaluatedOn ? new Date(indicator.lastEvaluatedOn).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                    {topic.learningIndicators.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                          No learning indicators found for this topic
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          
          {progression.topics.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No topics found for this chapter
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LearningProgressionPage;
