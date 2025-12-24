import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

/**
 * Hook to fetch chapters for a specific subject
 * @param {number} subjectId - Subject ID
 * @returns {Object} - Object containing chapters, loading state, and error
 */
export const useChaptersBySubjectId = (subjectId) => {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChaptersBySubject = async () => {
      if (!subjectId) {
        setChapters([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Use the API service to fetch chapters by subject ID
        const data = await apiService.getSubjectChapters(subjectId);
        
        // Transform the data to match the expected format
        const transformedData = data.map(chapter => ({
          id: chapter.id,
          name: chapter.name,
          subjectId: chapter.subject_id,
          description: chapter.description || `Chapter ${chapter.id} of this subject`
        }));
        
        setChapters(transformedData);
      } catch (err) {
        console.error('Error fetching chapters:', err);
        setError(err);
        
        // Fallback to empty array
        setChapters([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChaptersBySubject();
  }, [subjectId]);
  
  return { chapters, loading, error };
};

// Mock data for testing or fallback
export const mockChaptersData = [
  { id: 1, name: 'Introduction to Numbers', subjectId: 1, description: 'Learn about basic number concepts' },
  { id: 2, name: 'Addition and Subtraction', subjectId: 1, description: 'Master the basics of adding and subtracting' },
  { id: 3, name: 'Multiplication', subjectId: 1, description: 'Understand multiplication concepts' },
  { id: 4, name: 'Grammar Basics', subjectId: 2, description: 'Learn fundamental grammar rules' },
  { id: 5, name: 'Reading Comprehension', subjectId: 2, description: 'Develop skills to understand texts' },
  { id: 6, name: 'Plants and Animals', subjectId: 3, description: 'Explore the world of living things' },
  { id: 7, name: 'Weather and Climate', subjectId: 3, description: 'Learn about weather patterns and climate' }
];
