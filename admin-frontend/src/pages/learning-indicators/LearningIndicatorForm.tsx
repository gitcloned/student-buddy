import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { learningIndicatorsApi, topicsApi, Topic } from '../../services/api';

interface LearningIndicatorFormProps {
  isEditing?: boolean;
}

const LearningIndicatorForm: React.FC<LearningIndicatorFormProps> = ({ isEditing = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<{ title: string; topic_id: number | string; common_misconception: string }>({
    title: '',
    topic_id: '',
    common_misconception: ''
  });
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    const fetchLearningIndicator = async () => {
      if (isEditing && id) {
        try {
          const data = await learningIndicatorsApi.getById(Number(id));
          setFormData({
            title: data.title,
            topic_id: data.topic_id,
            common_misconception: data.common_misconception || ''
          });
        } catch (error) {
          console.error('Error fetching learning indicator:', error);
          setError('Failed to fetch learning indicator');
        } finally {
          setInitialLoading(false);
        }
      }
    };

    fetchLearningIndicator();
  }, [isEditing, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'topic_id' ? (value ? Number(value) : '') : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Validate form data
    if (!formData.title.trim() || !formData.topic_id) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      if (isEditing && id) {
        await learningIndicatorsApi.update(Number(id), {
          title: formData.title,
          topic_id: formData.topic_id as number,
          common_misconception: formData.common_misconception
        });
        setSuccessMessage('Learning indicator updated successfully');
        setTimeout(() => navigate('/learning-indicators'), 1500);
      } else {
        await learningIndicatorsApi.create({
          title: formData.title,
          topic_id: formData.topic_id as number,
          common_misconception: formData.common_misconception
        });
        setSuccessMessage('Learning indicator created successfully');
        setTimeout(() => navigate('/learning-indicators'), 1500);
      }
    } catch (error) {
      console.error('Error saving learning indicator:', error);
      setError('Failed to save learning indicator');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Learning Indicator' : 'Create Learning Indicator'}</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter the learning indicator title"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="topic_id">
            Topic (Learning Outcome) <span className="text-red-500">*</span>
          </label>
          <select
            id="topic_id"
            name="topic_id"
            value={formData.topic_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Select a topic</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>{topic.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="common_misconception">
            Common Misconception
          </label>
          <textarea
            id="common_misconception"
            name="common_misconception"
            value={formData.common_misconception}
            onChange={handleChange}
            placeholder="Enter common mistakes children make related to this learning indicator"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={4}
          />
          <p className="text-sm text-gray-600 mt-1">Describe common mistakes or misconceptions that children typically have with this concept.</p>
        </div>
        
        <div className="flex items-center">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isEditing ? 'Update' : 'Create')}
          </button>
          <button
            type="button"
            className="ml-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => navigate('/learning-indicators')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default LearningIndicatorForm;
