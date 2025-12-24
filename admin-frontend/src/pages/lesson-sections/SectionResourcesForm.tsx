import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { lessonSectionsApi, resourcesApi, Resource, LessonSection } from '../../services/api';

const SectionResourcesForm: React.FC = () => {
  const { planId, sectionId } = useParams<{ planId: string; sectionId: string }>();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [section, setSection] = useState<LessonSection | null>(null);
  // We'll store all resources in available and selected resources arrays
  const [selectedResources, setSelectedResources] = useState<number[]>([]);
  const [availableResources, setAvailableResources] = useState<Resource[]>([]);
  const [sectionResources, setSectionResources] = useState<Resource[]>([]);
  
  // Keep track of the original resource IDs to properly determine what changed
  const originalResourceIds = useRef<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!sectionId || !planId) {
        navigate('/lesson-plans');
        return;
      }

      try {
        setIsLoading(true);
        const [sectionData, allResourcesData, sectionResourcesData] = await Promise.all([
          lessonSectionsApi.getById(parseInt(sectionId)),
          resourcesApi.getAll(),
          lessonSectionsApi.getResources(parseInt(sectionId))
        ]);
        
        setSection(sectionData);
        setSectionResources(sectionResourcesData);
        
        // Initialize selected resources with current associations
        const currentResourceIds = sectionResourcesData.map(resource => resource.id as number);
        setSelectedResources(currentResourceIds);
        
        // Store the original resource IDs for comparison during save
        originalResourceIds.current = [...currentResourceIds];
        
        // Filter out resources already associated with this section
        const associatedIds = new Set(currentResourceIds);
        setAvailableResources(allResourcesData.filter(r => !associatedIds.has(r.id)));
        
        setError(null);
      } catch (err) {
        setError('Failed to load resources data. Please try again.');
        console.error('Resources data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sectionId, navigate]);

  const handleAddResource = (resourceId: number) => {
    setSelectedResources([...selectedResources, resourceId]);
    
    // Update UI immediately by moving the resource between arrays
    const resourceToAdd = availableResources.find(r => r.id === resourceId);
    if (resourceToAdd) {
      setAvailableResources(availableResources.filter(r => r.id !== resourceId));
      setSectionResources([...sectionResources, resourceToAdd]);
    }
  };

  const handleRemoveResource = (resourceId: number) => {
    setSelectedResources(selectedResources.filter(id => id !== resourceId));
    
    // Update UI immediately by moving the resource between arrays
    const resourceToRemove = sectionResources.find(r => r.id === resourceId);
    if (resourceToRemove) {
      setSectionResources(sectionResources.filter(r => r.id !== resourceId));
      setAvailableResources([...availableResources, resourceToRemove]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      // Find resources to remove (resources that were in original list but not in selected)
      const resourcesToRemove = originalResourceIds.current.filter(
        id => !selectedResources.includes(id)
      );
      
      // Find resources to add (resources that are in selected but not in original list)
      const resourcesToAdd = selectedResources.filter(
        id => !originalResourceIds.current.includes(id)
      );
      
      // Remove resources that are no longer selected
      for (const resourceId of resourcesToRemove) {
        await lessonSectionsApi.removeResource(parseInt(sectionId!), resourceId);
      }
      
      // Add newly selected resources
      for (const resourceId of resourcesToAdd) {
        await lessonSectionsApi.addResource(parseInt(sectionId!), resourceId);
      }
      
      setSuccess('Resources updated successfully!');
      // No need to navigate away - stay on the same page

      originalResourceIds.current = [...selectedResources];
    } catch (err) {
      setError('Failed to update resources. Please try again.');
      console.error('Resources update error:', err);
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

  if (!section) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        <p>Section not found.</p>
        <Link to={`/lesson-plans/${planId}/sections`} className="text-red-700 font-bold underline">
          Return to Sections
        </Link>
      </div>
    );
  }

  const getResourceTypeBadge = (type: string) => {
    const colorClasses: {[key: string]: string} = {
      'Concept Video': 'bg-blue-100 text-blue-800',
      'Question': 'bg-yellow-100 text-yellow-800',
      'Quiz': 'bg-purple-100 text-purple-800',
      'Practice Test': 'bg-green-100 text-green-800'
    };
    
    const colorClass = colorClasses[type] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to={`/lesson-plans/${planId}/sections`} className="text-blue-500 hover:underline mb-2 inline-block">
          &larr; Back to Sections
        </Link>
        <h3 className="text-lg font-semibold">
          Manage Resources for Section: {section.title}
        </h3>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <p>{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Selected Resources */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h4 className="font-medium text-lg mb-4">Selected Resources</h4>
          {sectionResources.length === 0 ? (
            <p className="text-gray-500 italic">No resources selected. Add resources from the list on the right.</p>
          ) : (
            <div className="space-y-3">
              {sectionResources.map(resource => (
                <div key={resource.id} className="bg-gray-50 rounded p-3 flex justify-between items-start">
                  <div>
                    <div className="flex items-center mb-1">
                      <h5 className="font-medium">{resource.title}</h5>
                      <div className="ml-2">{getResourceTypeBadge(resource.type)}</div>
                    </div>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate block">
                      {resource.url}
                    </a>
                    {resource.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{resource.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveResource(resource.id as number)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Available Resources */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-lg">Available Resources</h4>
            <Link to="/resources/new" className="text-primary hover:text-primary-dark text-sm">
              + Create New Resource
            </Link>
          </div>
          
          {availableResources.length === 0 ? (
            <p className="text-gray-500 italic">No more resources available. Create new resources or remove some from the selected list.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {availableResources.map(resource => (
                <div key={resource.id} className="bg-gray-50 rounded p-3 flex justify-between items-start">
                  <div>
                    <div className="flex items-center mb-1">
                      <h5 className="font-medium">{resource.title}</h5>
                      <div className="ml-2">{getResourceTypeBadge(resource.type)}</div>
                    </div>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate block">
                      {resource.url}
                    </a>
                    {resource.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{resource.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddResource(resource.id as number)}
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className={`bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSaving ? 'Saving...' : 'Save Resources'}
        </button>
      </form>
    </div>
  );
};

export default SectionResourcesForm;
