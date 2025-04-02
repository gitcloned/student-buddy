import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booksApi, Book, BookFeature } from '../../services/api';

// Initial empty states
const emptyBook: Book = {
  id: 0,
  features: []
};

const emptyFeature: BookFeature = {
  id: 0,
  book_id: 0,
  subject: '',
  name: '',
  how_to_teach: ''
};

const BookForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [book, setBook] = useState<Book>(emptyBook);
  const [features, setFeatures] = useState<BookFeature[]>([]);
  const [currentFeature, setCurrentFeature] = useState<BookFeature>(emptyFeature);
  const [editingFeatureIndex, setEditingFeatureIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Fetch book data if in edit mode
  useEffect(() => {
    const fetchBook = async () => {
      if (isEditMode) {
        try {
          setIsLoading(true);
          const fetchedBook = await booksApi.getById(parseInt(id as string));
          setBook(fetchedBook);
          setFeatures(fetchedBook.features || []);
        } catch (err) {
          setError('Failed to load book data. Please try again.');
          console.error('Error fetching book:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchBook();
  }, [id, isEditMode]);

  // Handle feature form input changes
  const handleFeatureChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentFeature(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add or update a feature
  const handleFeatureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentFeature.subject || !currentFeature.name || !currentFeature.how_to_teach) {
      setError('All feature fields are required');
      return;
    }

    if (editingFeatureIndex !== null) {
      // Update existing feature
      const updatedFeatures = [...features];
      updatedFeatures[editingFeatureIndex] = currentFeature;
      setFeatures(updatedFeatures);
    } else {
      // Add new feature
      setFeatures([...features, currentFeature]);
    }

    // Reset form
    setCurrentFeature({ ...emptyFeature, book_id: book.id });
    setEditingFeatureIndex(null);
    setError(null);
  };

  // Edit an existing feature
  const handleEditFeature = (index: number) => {
    setCurrentFeature(features[index]);
    setEditingFeatureIndex(index);
  };

  // Remove a feature
  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = features.filter((_, i) => i !== index);
    setFeatures(updatedFeatures);
  };

  // Save the entire book with features
  const handleSaveBook = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let savedBook: Book;
      
      if (isEditMode) {
        // Update existing book
        savedBook = await booksApi.update(book.id, { ...book, features });
        
        // Handle updating features
        for (const feature of features) {
          if (feature.id) {
            await booksApi.updateFeature(feature.id, feature);
          } else {
            await booksApi.createFeature(book.id, feature);
          }
        }
      } else {
        // Create new book
        savedBook = await booksApi.create();
        
        // Create all features for the new book
        for (const feature of features) {
          await booksApi.createFeature(savedBook.id, feature);
        }
      }

      setSaveMessage('Book saved successfully!');
      setTimeout(() => {
        navigate('/books');
      }, 1500);
    } catch (err) {
      setError('Failed to save book. Please try again.');
      console.error('Error saving book:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {isEditMode ? 'Edit Book' : 'Create New Book'}
        </h2>
        <button 
          onClick={() => navigate('/books')}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      )}

      {saveMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
          <p>{saveMessage}</p>
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Book Features</h3>
        
        <form onSubmit={handleFeatureSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input
                type="text"
                name="subject"
                value={currentFeature.subject}
                onChange={handleFeatureChange}
                className="w-full p-2 border rounded"
                placeholder="Math, Science, Reading, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Feature Name</label>
              <input
                type="text"
                name="name"
                value={currentFeature.name}
                onChange={handleFeatureChange}
                className="w-full p-2 border rounded"
                placeholder="Addition, Characters, Plot, etc."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">How to Teach</label>
            <textarea
              name="how_to_teach"
              value={currentFeature.how_to_teach}
              onChange={handleFeatureChange}
              rows={4}
              className="w-full p-2 border rounded"
              placeholder="Describe teaching methodology for this feature..."
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              {editingFeatureIndex !== null ? 'Update Feature' : 'Add Feature'}
            </button>
          </div>
        </form>
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Current Features:</h4>
          
          {features.length === 0 ? (
            <p className="text-gray-500 italic">No features added yet.</p>
          ) : (
            <ul className="divide-y">
              {features.map((feature, index) => (
                <li key={index} className="py-3">
                  <div className="flex justify-between">
                    <div>
                      <h5 className="font-medium">{feature.name}</h5>
                      <p className="text-sm text-gray-600">Subject: {feature.subject}</p>
                      <p className="text-sm mt-1">{feature.how_to_teach.substring(0, 100)}...</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditFeature(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveFeature(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveBook}
          disabled={isLoading || features.length === 0}
          className={`btn btn-primary ${(isLoading || features.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Saving...' : 'Save Book'} 
        </button>
      </div>
    </div>
  );
};

export default BookForm;