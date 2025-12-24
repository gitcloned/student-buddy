import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { learningIndicatorsApi, topicsApi, LearningIndicator, Topic } from '../../services/api';

const LearningIndicatorList: React.FC = () => {
  const [learningIndicators, setLearningIndicators] = useState<LearningIndicator[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const topicsData = await topicsApi.getAll();
        setTopics(topicsData);
      } catch (error) {
        console.error('Error fetching topics:', error);
        setError('Failed to fetch topics');
      }
    };

    fetchTopics();
  }, []);

  useEffect(() => {
    const fetchLearningIndicators = async () => {
      setLoading(true);
      try {
        let data;
        if (selectedTopicId) {
          data = await learningIndicatorsApi.getByTopic(selectedTopicId);
        } else {
          data = await learningIndicatorsApi.getAll();
        }
        setLearningIndicators(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching learning indicators:', error);
        setError('Failed to fetch learning indicators');
      } finally {
        setLoading(false);
      }
    };

    fetchLearningIndicators();
  }, [selectedTopicId]);

  const handleDelete = async (id: number) => {
    try {
      await learningIndicatorsApi.delete(id);
      setDeleteConfirmId(null);
      // Refresh the list
      if (selectedTopicId) {
        const data = await learningIndicatorsApi.getByTopic(selectedTopicId);
        setLearningIndicators(data);
      } else {
        const data = await learningIndicatorsApi.getAll();
        setLearningIndicators(data);
      }
    } catch (error) {
      console.error('Error deleting learning indicator:', error);
      setError('Failed to delete learning indicator');
    }
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedTopicId(value ? Number(value) : null);
  };

  const getTopicName = (topicId: number) => {
    const topic = topics.find(t => t.id === topicId);
    return topic ? topic.name : 'Unknown';
  };

  return (
    <div className="p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Learning Indicators</h1>
        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => navigate('/learning-indicators/create')}
        >
          Create New Learning Indicator
        </button>
      </div>

      <div className="mb-6">
        <label className="mr-2">Filter by Topic:</label>
        <select
          className="border rounded p-2"
          onChange={handleTopicChange}
          value={selectedTopicId || ''}
        >
          <option value="">All Topics</option>
          {topics.map(topic => (
            <option key={topic.id} value={topic.id}>{topic.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">ID</th>
                <th className="py-2 px-4 border-b">Title</th>
                <th className="py-2 px-4 border-b">Topic</th>
                <th className="py-2 px-4 border-b">Common Misconception</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {learningIndicators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">No learning indicators found</td>
                </tr>
              ) : (
                learningIndicators.map(indicator => (
                  <tr key={indicator.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-center">{indicator.id}</td>
                    <td className="py-2 px-4 border-b">{indicator.title}</td>
                    <td className="py-2 px-4 border-b">{getTopicName(indicator.topic_id)}</td>
                    <td className="py-2 px-4 border-b">{indicator.common_misconception ? 
                      (indicator.common_misconception.length > 50 ? 
                        `${indicator.common_misconception.substring(0, 50)}...` : 
                        indicator.common_misconception) : 
                      '—'}</td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex space-x-2">
                        <button
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
                          onClick={() => navigate(`/learning-indicators/edit/${indicator.id}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm"
                          onClick={() => navigate(`/learning-indicators/${indicator.id}/resources`)}
                        >
                          Manage Resources
                        </button>
                        {deleteConfirmId === indicator.id ? (
                          <div className="flex space-x-1">
                            <button
                              className="bg-red-600 hover:bg-red-800 text-white font-bold py-1 px-2 rounded text-sm"
                              onClick={() => handleDelete(indicator.id!)}
                            >
                              Confirm
                            </button>
                            <button
                              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-sm"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                            onClick={() => setDeleteConfirmId(indicator.id!)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LearningIndicatorList;
