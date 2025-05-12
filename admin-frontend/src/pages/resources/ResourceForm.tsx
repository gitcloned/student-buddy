import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resourcesApi, Resource } from '../../services/api';

const ResourceForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<{ 
    title: string; 
    type: string; 
    url: string; 
    description: string;
  }>({ 
    title: '', 
    type: 'Concept Video',
    url: '', 
    description: ''
  });

  const resourceTypes = [
    'Concept Video',
    'Question',
    'Quiz',
    'Practice Test'
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (id && id !== 'new') {
        try {
          setIsLoading(true);
          const resource = await resourcesApi.getById(parseInt(id));
          setFormValues({ 
            title: resource.title,
            type: resource.type,
            url: resource.url,
            description: resource.description
          });
          setError(null);
        } catch (err) {
          setError('Failed to load resource. Please try again.');
          console.error('Resource fetch error:', err);
        } finally {
          setIsLoading(false);
        }
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
    
    if (!formValues.title.trim()) {
      setError('Resource title is required.');
      return;
    }

    if (!formValues.url.trim()) {
      setError('Resource URL is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const resourceData = {
        title: formValues.title,
        type: formValues.type,
        url: formValues.url,
        description: formValues.description
      };
      
      if (id && id !== 'new') {
        await resourcesApi.update(parseInt(id), resourceData);
      } else {
        await resourcesApi.create(resourceData);
      }
      
      navigate('/resources');
    } catch (err) {
      setError('Failed to save resource. Please try again.');
      console.error('Resource save error:', err);
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
        {id && id !== 'new' ? 'Edit Resource' : 'Add New Resource'}
      </h3>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            Resource Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formValues.title}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter resource title"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
            Resource Type
          </label>
          <select
            id="type"
            name="type"
            value={formValues.type}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="url">
            Resource URL
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={formValues.url}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter resource URL (e.g., https://example.com/video)"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formValues.description}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter resource description"
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate('/resources')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Resource'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResourceForm;
