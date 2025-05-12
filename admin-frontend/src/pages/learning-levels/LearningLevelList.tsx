import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { learningLevelsApi, LearningLevel, childrenApi, Child, topicsApi, Topic } from '../../services/api';

const LearningLevelList: React.FC = () => {
  const [learningLevels, setLearningLevels] = useState<LearningLevel[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [learningLevelsData, childrenData, topicsData] = await Promise.all([
        learningLevelsApi.getAll(),
        childrenApi.getAll(),
        topicsApi.getAll()
      ]);
      setLearningLevels(learningLevelsData);
      setChildren(childrenData);
      setTopics(topicsData);
      setError(null);
    } catch (err) {
      setError('Failed to load learning levels. Please try again.');
      console.error('Learning levels fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this learning level?')) {
      try {
        await learningLevelsApi.delete(id);
        setLearningLevels(learningLevels.filter(level => level.id !== id));
      } catch (err) {
        setError('Failed to delete the learning level. Please try again.');
        console.error('Learning level delete error:', err);
      }
    }
  };

  const getChildName = (childId: number): string => {
    const child = children.find(c => c.id === childId);
    return child ? child.name : 'Unknown Child';
  };

  const getTopicName = (topicId: number): string => {
    const topic = topics.find(t => t.id === topicId);
    return topic ? topic.name : 'Unknown Topic';
  };

  const getLevelBadge = (level: number) => {
    const colorClasses = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-green-100 text-green-800',
      4: 'bg-blue-100 text-blue-800',
      5: 'bg-purple-100 text-purple-800'
    };
    // @ts-ignore
    const colorClass = colorClasses[level] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        Level {level}
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
        <h3 className="text-lg font-semibold">All Learning Levels</h3>
        <Link to="/learning-levels/new" className="btn btn-primary">
          Add New Learning Level
        </Link>
      </div>

      {learningLevels.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No learning levels found. Create your first one!</p>
          <Link to="/learning-levels/new" className="btn btn-primary mt-4">
            Create Learning Level
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
                  Child
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Topic
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {learningLevels.map((level) => (
                <tr key={level.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">{level.id}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{getChildName(level.child_id)}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{getTopicName(level.topic_id)}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{getLevelBadge(level.level)}</td>
                  <td className="py-4 px-4">
                    <div className="line-clamp-2">
                      {level.notes ? (level.notes.length > 50 ? `${level.notes.substring(0, 50)}...` : level.notes) : ''}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <Link
                      to={`/learning-levels/${level.id}`}
                      className="text-primary hover:text-primary-dark mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(level.id)}
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

export default LearningLevelList;
