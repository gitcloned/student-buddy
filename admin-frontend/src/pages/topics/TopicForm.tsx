import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { topicsApi, chaptersApi, Topic, Chapter } from '../../services/api';

const TopicForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [formValues, setFormValues] = useState<{ name: string; chapter_ids: number[] }>({ 
    name: '', 
    chapter_ids: [] 
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const chaptersData = await chaptersApi.getAll();
        setChapters(chaptersData);

        if (id && id !== 'new') {
          const topic = await topicsApi.getById(parseInt(id));
          setFormValues({ 
            name: topic.name,
            chapter_ids: topic.chapter_ids || []
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleChapterToggle = (chapterId: number) => {
    setFormValues(prev => {
      const isSelected = prev.chapter_ids.includes(chapterId);
      if (isSelected) {
        return { ...prev, chapter_ids: prev.chapter_ids.filter(id => id !== chapterId) };
      } else {
        return { ...prev, chapter_ids: [...prev.chapter_ids, chapterId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formValues.name.trim()) {
      setError('Topic name is required.');
      return;
    }

    if (formValues.chapter_ids.length === 0) {
      setError('At least one chapter is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const topicData = {
        name: formValues.name,
        chapter_ids: formValues.chapter_ids
      };
      
      if (id && id !== 'new') {
        await topicsApi.update(parseInt(id), topicData);
      } else {
        await topicsApi.create(topicData);
      }
      
      navigate('/topics');
    } catch (err) {
      setError('Failed to save topic. Please try again.');
      console.error('Topic save error:', err);
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
        {id && id !== 'new' ? 'Edit Topic' : 'Add New Topic'}
      </h3>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Topic Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter topic name"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Chapters (select one or more)
          </label>
          <div className="shadow border rounded w-full py-2 px-3 bg-white max-h-48 overflow-y-auto">
            {chapters.length === 0 ? (
              <p className="text-gray-500 text-sm">No chapters available</p>
            ) : (
              chapters.map((chapter) => (
                <label key={chapter.id} className="flex items-center py-1 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formValues.chapter_ids.includes(chapter.id!)}
                    onChange={() => handleChapterToggle(chapter.id!)}
                    className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="text-gray-700">{chapter.name}</span>
                </label>
              ))
            )}
          </div>
          {formValues.chapter_ids.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {formValues.chapter_ids.length} chapter(s) selected
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate('/topics')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Topic'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TopicForm;
