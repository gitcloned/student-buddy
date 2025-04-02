import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { personasApi, TeacherPersona } from '../../services/api';

const PersonaForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = id !== 'new';
  const personaId = isEditing ? parseInt(id as string) : undefined;
  
  const [formData, setFormData] = useState<TeacherPersona>({
    grade: '',
    persona: ''
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersona = async () => {
      if (!isEditing) return;
      
      try {
        setIsLoading(true);
        const data = await personasApi.getById(personaId as number);
        setFormData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load persona details. Please try again.');
        console.error('Persona fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersona();
  }, [personaId, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      
      if (isEditing && personaId) {
        await personasApi.update(personaId, formData);
      } else {
        await personasApi.create(formData);
      }
      
      navigate('/personas');
    } catch (err) {
      setError('Failed to save the persona. Please try again.');
      console.error('Persona save error:', err);
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
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold mb-6">
          {isEditing ? 'Edit Teacher Persona' : 'Create New Teacher Persona'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="grade" className="label">
              Grade Level
            </label>
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              required
              className="input"
            >
              <option value="">Select a grade level</option>
              <option value="Kindergarten">Kindergarten</option>
              <option value="1st Grade">1st Grade</option>
              <option value="2nd Grade">2nd Grade</option>
              <option value="3rd Grade">3rd Grade</option>
              <option value="4th Grade">4th Grade</option>
              <option value="5th Grade">5th Grade</option>
              <option value="6th Grade">6th Grade</option>
              <option value="7th Grade">7th Grade</option>
              <option value="8th Grade">8th Grade</option>
              <option value="9th Grade">9th Grade</option>
              <option value="10th Grade">10th Grade</option>
              <option value="11th Grade">11th Grade</option>
              <option value="12th Grade">12th Grade</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label htmlFor="persona" className="label">
              Teacher Persona Description
            </label>
            <textarea
              id="persona"
              name="persona"
              value={formData.persona}
              onChange={handleChange}
              required
              rows={6}
              className="input"
              placeholder="Describe the teacher persona and their teaching style..."
            ></textarea>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/personas')}
              className="btn btn-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : isEditing ? 'Update Persona' : 'Create Persona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonaForm;