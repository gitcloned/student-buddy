import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { teachersApi, Teacher, personasApi, TeacherPersona } from '../../services/api';

const TeacherList: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [personas, setPersonas] = useState<TeacherPersona[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [teachersData, personasData] = await Promise.all([
        teachersApi.getAll(),
        personasApi.getAll()
      ]);
      setTeachers(teachersData);
      setPersonas(personasData);
      setError(null);
    } catch (err) {
      setError('Failed to load teachers. Please try again.');
      console.error('Teachers fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await teachersApi.delete(id);
        setTeachers(teachers.filter(teacher => teacher.id !== id));
      } catch (err) {
        setError('Failed to delete the teacher. Please try again.');
        console.error('Teacher delete error:', err);
      }
    }
  };

  const getPersonaName = (personaId: number): string => {
    const persona = personas.find(p => p.id === personaId);
    return persona ? persona.name || 'Unknown Persona' : 'Unknown Persona';
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
        <h3 className="text-lg font-semibold">All Teachers</h3>
        <Link to="/teachers/new" className="btn btn-primary">
          Add New Teacher
        </Link>
      </div>

      {teachers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No teachers found. Create your first one!</p>
          <Link to="/teachers/new" className="btn btn-primary mt-4">
            Create Teacher
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
                  Name
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persona
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teaching Style
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">{teacher.id}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{teacher.name}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{getPersonaName(teacher.persona_id)}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{teacher.teaching_style}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <Link
                      to={`/teachers/${teacher.id}`}
                      className="text-primary hover:text-primary-dark mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(teacher.id)}
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

export default TeacherList;
