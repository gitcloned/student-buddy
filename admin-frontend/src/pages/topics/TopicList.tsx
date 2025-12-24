import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { topicsApi, Topic, chaptersApi, Chapter } from '../../services/api';

const TopicList: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [topicsData, chaptersData] = await Promise.all([
        topicsApi.getAll(),
        chaptersApi.getAll()
      ]);
      setTopics(topicsData);
      setChapters(chaptersData);
      setError(null);
    } catch (err) {
      setError('Failed to load topics. Please try again.');
      console.error('Topics fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this topic?')) {
      try {
        await topicsApi.delete(id);
        setTopics(topics.filter(topic => topic.id !== id));
      } catch (err) {
        setError('Failed to delete the topic. Please try again.');
        console.error('Topic delete error:', err);
      }
    }
  };

  const getChapterNames = (chapterIds: number[]): string => {
    if (!chapterIds || chapterIds.length === 0) return 'No chapters';
    const names = chapterIds
      .map(id => chapters.find(c => c.id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : 'Unknown Chapters';
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
        <h3 className="text-lg font-semibold">All Topics</h3>
        <Link to="/topics/new" className="btn btn-primary">
          Add New Topic
        </Link>
      </div>

      {topics.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No topics found. Create your first one!</p>
          <Link to="/topics/new" className="btn btn-primary mt-4">
            Create Topic
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
                  Chapters
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topics.map((topic) => (
                <tr key={topic.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">{topic.id}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{topic.name}</td>
                  <td className="py-4 px-4">{getChapterNames(topic.chapter_ids)}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <Link
                      to={`/topics/${topic.id}/prerequisites`}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Prerequisites
                    </Link>
                    <Link
                      to={`/topics/${topic.id}`}
                      className="text-primary hover:text-primary-dark mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(topic.id)}
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

export default TopicList;
