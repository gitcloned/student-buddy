import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { learningLevelsApi, childrenApi, topicsApi, LearningLevel, Child, Topic } from '../../services/api';

const LearningLevelForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [formValues, setFormValues] = useState<{ 
    child_id: number | string;
    topic_id: number | string;
    level: string;
    notes: string;
  }>({ 
    child_id: '',
    topic_id: '',
    level: '',
    notes: ''
  });

  // Define levels for dropdown
  const levelOptions = [
    { value: 'Weak', label: 'Weak' },
    { value: 'Average', label: 'Average' },
    { value: 'Strong', label: 'Strong' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [childrenData, topicsData] = await Promise.all([
          childrenApi.getAll(),
          topicsApi.getAll()
        ]);
        
        setChildren(childrenData);
        setTopics(topicsData);

        if (id && id !== 'new') {
          const learningLevel = await learningLevelsApi.getById(parseInt(id));
          setFormValues({ 
            child_id: learningLevel.child_id,
            topic_id: learningLevel.topic_id,
            level: learningLevel.level,
            notes: learningLevel.notes || ''
          });
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formValues.child_id) {
      setError('Child is required.');
      return;
    }

    if (!formValues.topic_id) {
      setError('Topic is required.');
      return;
    }

    if (!formValues.level) {
      setError('Learning level is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const learningLevelData = {
        child_id: Number(formValues.child_id),
        topic_id: Number(formValues.topic_id),
        level: formValues.level,
        notes: formValues.notes
      };
      
      if (id && id !== 'new') {
        await learningLevelsApi.update(parseInt(id), learningLevelData);
      } else {
        await learningLevelsApi.create(learningLevelData);
      }
      
      navigate('/learning-levels');
    } catch (err) {
      setError('Failed to save learning level. Please try again.');
      console.error('Learning level save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold mb-6">
        {id && id !== 'new' ? 'Edit Learning Level' : 'Add New Learning Level'}
      </h3>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="child_id">
            Child
          </label>
          <select
            id="child_id"
            name="child_id"
            value={formValues.child_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a child</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="topic_id">
            Topic
          </label>
          <select
            id="topic_id"
            name="topic_id"
            value={formValues.topic_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a topic</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="level">
            Learning Level
          </label>
          <select
            id="level"
            name="level"
            value={formValues.level}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a level</option>
            {levelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formValues.notes}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter notes about the child's learning level"
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate('/learning-levels')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Learning Level'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LearningLevelForm;
