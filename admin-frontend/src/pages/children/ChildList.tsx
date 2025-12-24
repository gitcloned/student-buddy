import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { childrenApi, Child, gradesApi, Grade } from '../../services/api';

const ChildList: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [childrenData, gradesData] = await Promise.all([
        childrenApi.getAll(),
        gradesApi.getAll()
      ]);
      setChildren(childrenData);
      setGrades(gradesData);
      setError(null);
    } catch (err) {
      setError('Failed to load children. Please try again.');
      console.error('Children fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this child?')) {
      try {
        await childrenApi.delete(id);
        setChildren(children.filter(child => child.id !== id));
      } catch (err) {
        setError('Failed to delete the child. Please try again.');
        console.error('Child delete error:', err);
      }
    }
  };

  const getGradeName = (gradeId: number): string => {
    const grade = grades.find(g => g.id === gradeId);
    return grade ? grade.name : 'Unknown Grade';
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
        <h3 className="text-lg font-semibold">All Children</h3>
        <Link to="/children/new" className="btn btn-primary">
          Add New Child
        </Link>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No children found. Create your first one!</p>
          <Link to="/children/new" className="btn btn-primary mt-4">
            Create Child
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
                  Grade
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {children.map((child) => (
                <tr key={child.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">{child.id}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{child.name}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{getGradeName(child.grade_id)}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <Link
                      to={`/children/${child.id}`}
                      className="text-primary hover:text-primary-dark mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(child.id)}
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

export default ChildList;
