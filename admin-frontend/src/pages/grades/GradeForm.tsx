import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gradesApi, Grade } from '../../services/api';

const GradeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<{ name: string }>({ name: '' });

  useEffect(() => {
    if (id && id !== 'new') {
      fetchGrade(parseInt(id));
    }
  }, [id]);

  const fetchGrade = async (gradeId: number) => {
    try {
      setIsLoading(true);
      const grade = await gradesApi.getById(gradeId);
      setFormValues({ name: grade.name });
      setError(null);
    } catch (err) {
      setError('Failed to load grade. Please try again.');
      console.error('Grade fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formValues.name.trim()) {
      setError('Grade name is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      if (id && id !== 'new') {
        await gradesApi.update(parseInt(id), formValues);
      } else {
        await gradesApi.create(formValues);
      }
      
      navigate('/grades');
    } catch (err) {
      setError('Failed to save grade. Please try again.');
      console.error('Grade save error:', err);
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
        {id && id !== 'new' ? 'Edit Grade' : 'Add New Grade'}
      </h3>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Grade Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter grade name (e.g. 'Grade 1', 'Kindergarten')"
          />
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate('/grades')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Grade'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GradeForm;
