import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teachersApi, personasApi, Teacher, TeacherPersona } from '../../services/api';

const TeacherForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [personas, setPersonas] = useState<TeacherPersona[]>([]);
  const [formValues, setFormValues] = useState<{ name: string; persona_id: number | string; teaching_style: string }>({ 
    name: '', 
    persona_id: '', 
    teaching_style: '' 
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const personasData = await personasApi.getAll();
        setPersonas(personasData);

        if (id && id !== 'new') {
          const teacher = await teachersApi.getById(parseInt(id));
          setFormValues({ 
            name: teacher.name,
            persona_id: teacher.persona_id,
            teaching_style: teacher.teaching_style
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
    
    if (!formValues.name.trim()) {
      setError('Teacher name is required.');
      return;
    }

    if (!formValues.persona_id) {
      setError('Teacher persona is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const teacherData = {
        name: formValues.name,
        persona_id: Number(formValues.persona_id),
        teaching_style: formValues.teaching_style
      };
      
      if (id && id !== 'new') {
        await teachersApi.update(parseInt(id), teacherData);
      } else {
        await teachersApi.create(teacherData);
      }
      
      navigate('/teachers');
    } catch (err) {
      setError('Failed to save teacher. Please try again.');
      console.error('Teacher save error:', err);
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
        {id && id !== 'new' ? 'Edit Teacher' : 'Add New Teacher'}
      </h3>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Teacher Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter teacher name"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="persona_id">
            Teacher Persona
          </label>
          <select
            id="persona_id"
            name="persona_id"
            value={formValues.persona_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a persona</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.name || 'Unnamed Persona'}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="teaching_style">
            Teaching Style
          </label>
          <textarea
            id="teaching_style"
            name="teaching_style"
            value={formValues.teaching_style}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Describe teaching style"
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate('/teachers')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherForm;
