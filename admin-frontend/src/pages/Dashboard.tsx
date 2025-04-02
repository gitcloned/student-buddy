import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { personasApi, booksApi, TeacherPersona, Book } from '../services/api';

const Dashboard: React.FC = () => {
  const [personasCount, setPersonasCount] = useState<number>(0);
  const [booksCount, setBooksCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [personas, books] = await Promise.all([
          personasApi.getAll(),
          booksApi.getAll()
        ]);
        
        setPersonasCount(personas.length);
        setBooksCount(books.length);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Teacher Personas</h3>
        <div className="flex justify-between items-center">
          <div className="text-3xl font-bold">{personasCount}</div>
          <Link to="/personas" className="btn btn-primary">
            Manage Personas
          </Link>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Books & Features</h3>
        <div className="flex justify-between items-center">
          <div className="text-3xl font-bold">{booksCount}</div>
          <Link to="/books" className="btn btn-primary">
            Manage Books
          </Link>
        </div>
      </div>

      <div className="card md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Getting Started</h3>
        <p className="mb-4">
          Welcome to the AI Tutor Admin panel. Here you can manage:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Teacher personas with specific grade levels and teaching styles</li>
          <li>Books with educational features</li>
          <li>Book features with subjects, names, and teaching methodologies</li>
        </ul>
        <p>
          Use the navigation menu on the left to access different sections of the admin panel.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;