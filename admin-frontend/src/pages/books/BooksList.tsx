import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { booksApi, Book } from '../../services/api';

const BooksList: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      const data = await booksApi.getAll();
      setBooks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load books. Please try again.');
      console.error('Books fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleCreateBook = async () => {
    try {
      const newBook = await booksApi.create();
      // After creating a book, navigate immediately to the edit form
      window.location.href = `/books/${newBook.id}`;
    } catch (err) {
      setError('Failed to create a new book. Please try again.');
      console.error('Book create error:', err);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await booksApi.delete(id);
        setBooks(books.filter(book => book.id !== id));
      } catch (err) {
        setError('Failed to delete the book. Please try again.');
        console.error('Book delete error:', err);
      }
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
    <div>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">All Books</h3>
        <button onClick={handleCreateBook} className="btn btn-primary">
          Add New Book
        </button>
      </div>

      {books.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No books found. Create your first one!</p>
          <button onClick={handleCreateBook} className="btn btn-primary mt-4">
            Create Book
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <div key={book.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-semibold">Book #{book.id}</h4>
                <div className="flex gap-2">
                  <Link
                    to={`/books/${book.id}`}
                    className="text-primary hover:text-primary-dark"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 mb-2">
                Features: {book.features.length}
              </div>
              
              {book.features.length > 0 ? (
                <ul className="text-sm">
                  {book.features.slice(0, 3).map((feature) => (
                    <li key={feature.id} className="mb-1 truncate">
                      • {feature.subject}: {feature.name}
                    </li>
                  ))}
                  {book.features.length > 3 && (
                    <li className="text-gray-500">
                      ... and {book.features.length - 3} more
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No features added yet</p>
              )}
              
              <Link
                to={`/books/${book.id}`}
                className="btn btn-secondary w-full mt-4 text-center"
              >
                Manage Features
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BooksList;