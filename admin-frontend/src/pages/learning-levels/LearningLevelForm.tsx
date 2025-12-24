import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { learningLevelsApi, childrenApi, learningIndicatorsApi, Child, LearningIndicator } from '../../services/api';

const LearningLevelForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [learningIndicators, setLearningIndicators] = useState<LearningIndicator[]>([]);
  const [formValues, setFormValues] = useState<{ 
    child_id: number | string;
    learning_indicator_id: number | string;
    level: string;
    state: 'assess' | 'teach' | 'taught' | null;
    notes: string;
    do_not_understand: string;
    what_next: string;
  }>({ 
    child_id: '',
    learning_indicator_id: '',
    level: '',
    state: null,
    notes: '',
    do_not_understand: '',
    what_next: ''
  });

  // Define levels for dropdown
  const levelOptions = [
    { value: 'Weak', label: 'Weak' },
    { value: 'Average', label: 'Average' },
    { value: 'Strong', label: 'Strong' }
  ];
  
  // Define state options for dropdown
  const stateOptions = [
    { value: 'assess', label: 'Assess' },
    { value: 'teach', label: 'Teach' },
    { value: 'taught', label: 'Taught' },
    { value: '', label: 'None' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [childrenData, learningIndicatorsData] = await Promise.all([
          childrenApi.getAll(),
          learningIndicatorsApi.getAll()
        ]);
        
        setChildren(childrenData);
        setLearningIndicators(learningIndicatorsData);

        if (id && id !== 'new') {
          const learningLevel = await learningLevelsApi.getById(parseInt(id));
          setFormValues({ 
            child_id: learningLevel.child_id,
            learning_indicator_id: learningLevel.learning_indicator_id,
            level: learningLevel.level,
            state: learningLevel.state,
            notes: learningLevel.notes || '',
            do_not_understand: learningLevel.do_not_understand || '',
            what_next: learningLevel.what_next || ''
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
    setFormValues({ ...formValues, [name]: value === '' && name === 'state' ? null : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formValues.child_id) {
      setError('Child is required.');
      return;
    }

    if (!formValues.learning_indicator_id) {
      setError('Learning indicator is required.');
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
        learning_indicator_id: Number(formValues.learning_indicator_id),
        level: formValues.level,
        state: formValues.state,
        notes: formValues.notes,
        do_not_understand: formValues.do_not_understand,
        what_next: formValues.what_next
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
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="learning_indicator_id">
            Learning Indicator
          </label>
          <select
            id="learning_indicator_id"
            name="learning_indicator_id"
            value={formValues.learning_indicator_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a learning indicator</option>
            {learningIndicators.map((indicator) => (
              <option key={indicator.id} value={indicator.id}>
                {indicator.title}
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
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="state">
            State
          </label>
          <select
            id="state"
            name="state"
            value={formValues.state || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">None</option>
            {stateOptions.filter(option => option.value !== '').map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="do_not_understand">
            Do Not Understand
          </label>
          <textarea
            id="do_not_understand"
            name="do_not_understand"
            value={formValues.do_not_understand}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={3}
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="what_next">
            What Next
          </label>
          <textarea
            id="what_next"
            name="what_next"
            value={formValues.what_next}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={3}
          ></textarea>
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
            rows={4}
          ></textarea>
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