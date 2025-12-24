import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { chaptersApi, Chapter, subjectsApi, Subject } from '../../services/api';

const ChapterList: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [chaptersData, subjectsData] = await Promise.all([
        chaptersApi.getAll(),
        subjectsApi.getAll()
      ]);
      setChapters(chaptersData);
      setSubjects(subjectsData);
      setError(null);
    } catch (err) {
      setError('Failed to load chapters. Please try again.');
      console.error('Chapters fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      try {
        await chaptersApi.delete(id);
        setChapters(chapters.filter(chapter => chapter.id !== id));
      } catch (err) {
        setError('Failed to delete the chapter. Please try again.');
        console.error('Chapter delete error:', err);
      }
    }
  };

  const getSubjectName = (subjectId: number): string => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
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
        <h3 className="text-lg font-semibold">All Chapters</h3>
        <Link to="/chapters/new" className="btn btn-primary">
          Add New Chapter
        </Link>
      </div>

      {chapters.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No chapters found. Create your first one!</p>
          <Link to="/chapters/new" className="btn btn-primary mt-4">
            Create Chapter
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
                  Subject
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chapters.map((chapter) => (
                <tr key={chapter.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">{chapter.id}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{chapter.name}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{getSubjectName(chapter.subject_id)}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <Link
                      to={`/chapters/${chapter.id}`}
                      className="text-primary hover:text-primary-dark mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(chapter.id)}
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

export default ChapterList;
