import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subjectsApi, Subject, gradesApi, Grade, booksApi, Book, teachersApi, Teacher } from '../../services/api';

const SubjectList: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [subjectsData, gradesData, booksData, teachersData] = await Promise.all([
        subjectsApi.getAll(),
        gradesApi.getAll(),
        booksApi.getAll(),
        teachersApi.getAll()
      ]);
      setSubjects(subjectsData);
      setGrades(gradesData);
      setBooks(booksData);
      setTeachers(teachersData);
      setError(null);
    } catch (err) {
      setError('Failed to load subjects. Please try again.');
      console.error('Subjects fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectsApi.delete(id);
        setSubjects(subjects.filter(subject => subject.id !== id));
      } catch (err) {
        setError('Failed to delete the subject. Please try again.');
        console.error('Subject delete error:', err);
      }
    }
  };

  const getGradeName = (gradeId: number): string => {
    const grade = grades.find(g => g.id === gradeId);
    return grade ? grade.name : 'Unknown Grade';
  };

  const getBookName = (bookId?: number): string => {
    if (!bookId) return 'Not assigned';
    const book = books.find(b => b.id === bookId);
    return book ? `Book #${book.id}` : 'Unknown Book';
  };

  const getTeacherName = (teacherId?: number): string => {
    if (!teacherId) return 'Not assigned';
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Unknown Teacher';
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
        <h3 className="text-lg font-semibold">All Subjects</h3>
        <Link to="/subjects/new" className="btn btn-primary">
          Add New Subject
        </Link>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No subjects found. Create your first one!</p>
          <Link to="/subjects/new" className="btn btn-primary mt-4">
            Create Subject
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
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default Teacher
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">{subject.id}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{subject.name}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{getGradeName(subject.grade_id)}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{getBookName(subject.book_id)}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{getTeacherName(subject.default_teacher_id)}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <Link
                      to={`/subjects/${subject.id}`}
                      className="text-primary hover:text-primary-dark mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(subject.id)}
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

export default SubjectList;
