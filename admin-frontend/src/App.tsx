import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PersonaList from './pages/personas/PersonaList';
import PersonaForm from './pages/personas/PersonaForm';
import BooksList from './pages/books/BooksList';
import BookForm from './pages/books/BookForm';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/personas" element={<PersonaList />} />
          <Route path="/personas/new" element={<PersonaForm />} />
          <Route path="/personas/:id" element={<PersonaForm />} />
          <Route path="/books" element={<BooksList />} />
          <Route path="/books/new" element={<BookForm />} />
          <Route path="/books/:id" element={<BookForm />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;