import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subjectsApi, gradesApi, booksApi, teachersApi, Subject, Grade, Book, Teacher } from '../../services/api';

const SubjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [formValues, setFormValues] = useState<{ 
    name: string; 
    grade_id: number | string;
    book_id?: number | string;
    default_teacher_id?: number | string;
  }>({ 
    name: '', 
    grade_id: '',
    book_id: '',
    default_teacher_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [gradesData, booksData, teachersData] = await Promise.all([
          gradesApi.getAll(),
          booksApi.getAll(),
          teachersApi.getAll()
        ]);
        
        setGrades(gradesData);
        setBooks(booksData);
        setTeachers(teachersData);

        if (id && id !== 'new') {
          const subject = await subjectsApi.getById(parseInt(id));
          setFormValues({ 
            name: subject.name,
            grade_id: subject.grade_id,
            book_id: subject.book_id || '',
            default_teacher_id: subject.default_teacher_id || ''
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formValues.name.trim()) {
      setError('Subject name is required.');
      return;
    }

    if (!formValues.grade_id) {
      setError('Grade is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const subjectData = {
        name: formValues.name,
        grade_id: Number(formValues.grade_id),
        book_id: formValues.book_id ? Number(formValues.book_id) : undefined,
        default_teacher_id: formValues.default_teacher_id ? Number(formValues.default_teacher_id) : undefined
      };
      
      if (id && id !== 'new') {
        await subjectsApi.update(parseInt(id), subjectData);
      } else {
        await subjectsApi.create(subjectData);
      }
      
      navigate('/subjects');
    } catch (err) {
      setError('Failed to save subject. Please try again.');
      console.error('Subject save error:', err);
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
        {id && id !== 'new' ? 'Edit Subject' : 'Add New Subject'}
      </h3>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Subject Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter subject name (e.g. Mathematics, Physics)"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="grade_id">
            Grade
          </label>
          <select
            id="grade_id"
            name="grade_id"
            value={formValues.grade_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a grade</option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="book_id">
            Book (Optional)
          </label>
          <select
            id="book_id"
            name="book_id"
            value={formValues.book_id || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a book</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.id} {/* Replace with book name/title if available */}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="default_teacher_id">
            Default Teacher (Optional)
          </label>
          <select
            id="default_teacher_id"
            name="default_teacher_id"
            value={formValues.default_teacher_id || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate('/subjects')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Subject'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubjectForm;
