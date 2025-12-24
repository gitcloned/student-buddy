import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// Define props interface to include children
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-primary-dark' : '';
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-primary text-white shadow-lg">
        <div className="p-4">
          <h1 className="text-2xl font-bold">AI Tutor Admin</h1>
        </div>
        <nav className="mt-4">
          <ul>
            <li>
              <Link
                to="/"
                className={`block px-4 py-2 hover:bg-primary-dark ${isActive('/')}`}
              >
                All entities
              </Link>
            </li>
            <li>
              <Link
                to="/learning-progression"
                className={`block px-4 py-2 hover:bg-primary-dark ${isActive('/learning-progression')}`}
              >
                Learning progression
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-x-auto">
        <header className="bg-white shadow-sm">
          <div className="px-4 py-3">
            <h2 className="text-xl font-semibold text-gray-800">
              {location.pathname === '/' && 'Dashboard'}
              {location.pathname === '/personas' && 'Teacher Personas'}
              {location.pathname.includes('/personas/') && 'Manage Persona'}
              {location.pathname === '/books' && 'Books & Features'}
              {location.pathname.includes('/books/') && 'Manage Book'}
            </h2>
          </div>
        </header>
        <main className="p-6">
          {children} {/* Render children instead of Outlet */}
        </main>
      </div>
    </div>
  );
};

export default Layout;