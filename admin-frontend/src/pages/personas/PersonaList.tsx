import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { personasApi, TeacherPersona } from '../../services/api';

const PersonasList: React.FC = () => {
  const [personas, setPersonas] = useState<TeacherPersona[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonas = async () => {
    try {
      setIsLoading(true);
      const data = await personasApi.getAll();
      setPersonas(data);
      setError(null);
    } catch (err) {
      setError('Failed to load teacher personas. Please try again.');
      console.error('Personas fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this persona?')) {
      try {
        await personasApi.delete(id);
        setPersonas(personas.filter(persona => persona.id !== id));
      } catch (err) {
        setError('Failed to delete the persona. Please try again.');
        console.error('Persona delete error:', err);
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

  return (
    <div>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">All Teacher Personas</h3>
        <Link to="/personas/new" className="btn btn-primary">
          Add New Persona
        </Link>
      </div>

      {personas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No teacher personas found. Create your first one!</p>
          <Link to="/personas/new" className="btn btn-primary mt-4">
            Create Persona
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persona
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {personas.map((persona) => (
                <tr key={persona.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">{persona.id}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{persona.grade}</td>
                  <td className="py-4 px-4">
                    <div className="line-clamp-2">{persona.persona.substring(0, 100)}...</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <Link
                      to={`/personas/${persona.id}`}
                      className="text-primary hover:text-primary-dark mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(persona.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PersonasList;