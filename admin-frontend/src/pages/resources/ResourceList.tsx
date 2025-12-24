import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resourcesApi, Resource } from '../../services/api';

const ResourceList: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const resourcesData = await resourcesApi.getAll();
      setResources(resourcesData);
      setError(null);
    } catch (err) {
      setError('Failed to load resources. Please try again.');
      console.error('Resources fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await resourcesApi.delete(id);
        setResources(resources.filter(resource => resource.id !== id));
      } catch (err) {
        setError('Failed to delete the resource. Please try again.');
        console.error('Resource delete error:', err);
      }
    }
  };

  const getResourceTypeBadge = (type: string) => {
    const colorClasses = {
      'Concept Video': 'bg-blue-100 text-blue-800',
      'Question': 'bg-green-100 text-green-800',
      'Quiz': 'bg-purple-100 text-purple-800',
      'Practice Test': 'bg-orange-100 text-orange-800'
    };
    // @ts-ignore - We know that type will be one of these keys
    const colorClass = colorClasses[type] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {type}
      </span>
    );
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
        <h3 className="text-lg font-semibold">All Resources</h3>
        <Link to="/resources/new" className="btn btn-primary">
          Add New Resource
        </Link>
      </div>

      {resources.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No resources found. Create your first one!</p>
          <Link to="/resources/new" className="btn btn-primary mt-4">
            Create Resource
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
                  Title
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">{resource.id}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{resource.title}</td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {getResourceTypeBadge(resource.type)}
                  </td>
                  <td className="py-4 px-4">
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {resource.url.length > 40 ? `${resource.url.substring(0, 40)}...` : resource.url}
                    </a>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <Link
                      to={`/resources/${resource.id}`}
                      className="text-primary hover:text-primary-dark mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(resource.id)}
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

export default ResourceList;
