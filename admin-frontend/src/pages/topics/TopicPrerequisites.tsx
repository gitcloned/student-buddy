import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { topicsApi, Topic, TopicPrerequisite } from '../../services/api';

const TopicPrerequisites: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [prerequisites, setPrerequisites] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const topicId = id ? parseInt(id) : 0;

  const fetchData = async () => {
    if (!topicId) {
      navigate('/topics');
      return;
    }
    
    try {
      setIsLoading(true);
      const [topicData, allTopics, prerequisiteTopics] = await Promise.all([
        topicsApi.getById(topicId),
        topicsApi.getAll(),
        topicsApi.getPrerequisites(topicId),
      ]);
      
      setTopic(topicData);
      setPrerequisites(prerequisiteTopics);
      
      // Filter out the current topic and already added prerequisites
      const prerequisiteIds = prerequisiteTopics.map(p => p.id);
      const filteredTopics = allTopics.filter(
        t => t.id !== topicId && !prerequisiteIds.includes(t.id)
      );
      setAvailableTopics(filteredTopics);
      
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [topicId]);

  const handleAddPrerequisite = async () => {
    if (!selectedTopic) {
      setError('Please select a topic to add as prerequisite.');
      return;
    }

    try {
      await topicsApi.addPrerequisite(topicId, parseInt(selectedTopic));
      // Refetch data to update lists
      fetchData();
      setSelectedTopic('');
    } catch (err) {
      setError('Failed to add prerequisite. Please try again.');
      console.error('Add prerequisite error:', err);
    }
  };

  const handleRemovePrerequisite = async (prerequisiteId: number) => {
    if (window.confirm('Are you sure you want to remove this prerequisite?')) {
      try {
        await topicsApi.removePrerequisite(topicId, prerequisiteId);
        // Refetch data to update lists
        fetchData();
      } catch (err) {
        setError('Failed to remove prerequisite. Please try again.');
        console.error('Remove prerequisite error:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!topic) {
    return <div>Topic not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Prerequisites for Topic: {topic.name}</h3>
        <Link to="/topics" className="btn btn-secondary">
          Back to Topics
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h4 className="text-md font-semibold mb-4">Add Prerequisite</h4>
        <div className="flex items-end space-x-4">
          <div className="flex-grow">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prerequisite">
              Select Topic
            </label>
            <select
              id="prerequisite"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Select a prerequisite topic</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddPrerequisite}
            disabled={!selectedTopic}
            className={`bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${!selectedTopic ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Add Prerequisite
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h4 className="text-md font-semibold p-4 bg-gray-50 border-b">Current Prerequisites</h4>
        {prerequisites.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No prerequisites defined for this topic.</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {prerequisites.map((prerequisite) => (
                <tr key={prerequisite.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">{prerequisite.id}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{prerequisite.name}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleRemovePrerequisite(prerequisite.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TopicPrerequisites;
