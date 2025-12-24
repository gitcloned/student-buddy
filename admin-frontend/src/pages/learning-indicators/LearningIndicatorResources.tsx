import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { learningIndicatorsApi, resourcesApi, Resource, LearningIndicator } from '../../services/api';

const LearningIndicatorResources: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [learningIndicator, setLearningIndicator] = useState<LearningIndicator | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [addingResource, setAddingResource] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [removeConfirmId, setRemoveConfirmId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (id) {
          // Fetch the learning indicator details
          const indicatorData = await learningIndicatorsApi.getById(Number(id));
          setLearningIndicator(indicatorData);
          
          // Fetch resources associated with this learning indicator
          const resourcesData = await learningIndicatorsApi.getResources(Number(id));
          setResources(resourcesData);
          
          // Fetch all resources for the dropdown
          const allResourcesData = await resourcesApi.getAll();
          setAllResources(allResourcesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddResource = async () => {
    if (!selectedResourceId) {
      setError('Please select a resource to add');
      return;
    }

    setAddingResource(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await learningIndicatorsApi.addResource(Number(id), Number(selectedResourceId));
      setSuccessMessage('Resource added successfully');
      
      // Refresh the resources list
      const resourcesData = await learningIndicatorsApi.getResources(Number(id));
      setResources(resourcesData);
      
      // Reset selection
      setSelectedResourceId('');
    } catch (error) {
      console.error('Error adding resource:', error);
      setError('Failed to add resource');
    } finally {
      setAddingResource(false);
    }
  };

  const handleRemoveResource = async (resourceId: number) => {
    setError(null);
    setSuccessMessage(null);
    try {
      await learningIndicatorsApi.removeResource(Number(id), resourceId);
      setSuccessMessage('Resource removed successfully');
      setRemoveConfirmId(null);
      
      // Refresh the resources list
      const resourcesData = await learningIndicatorsApi.getResources(Number(id));
      setResources(resourcesData);
    } catch (error) {
      console.error('Error removing resource:', error);
      setError('Failed to remove resource');
    }
  };

  // Filter out resources that are already associated with this learning indicator
  const availableResources = allResources.filter(
    resource => !resources.some(r => r.id === resource.id)
  );

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedResourceId(e.target.value);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
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

      <div className="flex flex-col space-y-6">
        <div>
          <button 
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mb-4"
            onClick={() => navigate('/learning-indicators')} 
          >
            Back to Learning Indicators
          </button>
        </div>

        {learningIndicator && (
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-xl font-bold">Learning Indicator: {learningIndicator.title}</h2>
            <p className="text-gray-600">ID: {learningIndicator.id}</p>
          </div>
        )}

        <div>
          <h3 className="text-lg font-bold mb-2">Associated Resources</h3>
          {resources.length === 0 ? (
            <p className="text-gray-500 italic">No resources associated with this learning indicator</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">ID</th>
                    <th className="py-2 px-4 border-b">Title</th>
                    <th className="py-2 px-4 border-b">Type</th>
                    <th className="py-2 px-4 border-b">URL</th>
                    <th className="py-2 px-4 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map(resource => (
                    <tr key={resource.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b text-center">{resource.id}</td>
                      <td className="py-2 px-4 border-b">{resource.title}</td>
                      <td className="py-2 px-4 border-b">{resource.type}</td>
                      <td className="py-2 px-4 border-b">
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {resource.url.length > 30 ? `${resource.url.substring(0, 30)}...` : resource.url}
                        </a>
                      </td>
                      <td className="py-2 px-4 border-b">
                        {removeConfirmId === resource.id ? (
                          <div className="flex space-x-1">
                            <button
                              className="bg-red-600 hover:bg-red-800 text-white font-bold py-1 px-2 rounded text-sm"
                              onClick={() => handleRemoveResource(resource.id!)}
                            >
                              Confirm
                            </button>
                            <button
                              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-sm"
                              onClick={() => setRemoveConfirmId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                            onClick={() => setRemoveConfirmId(resource.id!)}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold mb-2">Add Resource</h3>
          <div className="flex flex-wrap items-center space-x-2">
            <select
              className="border rounded p-2 w-64"
              value={selectedResourceId}
              onChange={handleSelectChange}
            >
              <option value="">Select a resource to add</option>
              {availableResources.map(resource => (
                <option key={resource.id} value={resource.id}>
                  {resource.title} ({resource.type})
                </option>
              ))}
            </select>
            <button 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleAddResource} 
              disabled={addingResource || !selectedResourceId}
            >
              {addingResource ? 'Adding...' : 'Add Resource'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningIndicatorResources;
