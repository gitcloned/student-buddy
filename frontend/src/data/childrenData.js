import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

/**
 * Custom hook to fetch children data from the API
 * @returns {Object} - Object containing children data and loading state
 */
export const useChildrenData = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        
        // Fetch both children and grades data in parallel
        const [childrenData, gradesData] = await Promise.all([
          apiService.getChildren(),
          apiService.getGrades()
        ]);
        
        // Create a map of grade_id to grade name for easy lookup
        const gradesMap = {};
        gradesData.forEach(grade => {
          gradesMap[grade.id] = grade.name || `Grade ${grade.id}`;
        });
        
        // Transform the data to match the expected format
        const transformedData = childrenData.map(child => {
          // Get the grade name from the map, or use a formatted version of grade_id as fallback
          const gradeName = child.grade_id && gradesMap[child.grade_id] 
            ? gradesMap[child.grade_id] 
            : (child.grade_id ? `${child.grade_id}${getGradeSuffix(child.grade_id)} Grade` : 'Unknown Grade');
            
          return {
            id: child.id,
            name: child.name,
            grade: gradeName,
            grade_id: child.grade_id, // Keep the original grade_id for reference
            // Generate avatar based on name
            avatar: `https://api.dicebear.com/7.x/${child.id % 2 === 0 ? 'bottts' : 'adventurer'}/svg?seed=${child.name}`,
            // We'll need to implement book IDs fetching if needed
            bookIds: []
          };
        });
        
        setChildren(transformedData);
      } catch (err) {
        console.error('Failed to fetch children:', err);
        setError(err.message);
        
        // Fallback to mock data in case of error
        setChildren([
          {
            id: 1,
            name: "Ravi",
            grade: "1st Grade",
            avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
            bookIds: [1, 2, 3]
          },
          {
            id: 2,
            name: "Aryan",
            grade: "2nd Grade",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sam",
            bookIds: [4, 5, 6]
          },
          {
            id: 3,
            name: "Ritu",
            grade: "3rd Grade",
            avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan",
            bookIds: [7, 8, 9]
          },
          {
            id: 4,
            name: "Gaurav",
            grade: "4th Grade",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Taylor",
            bookIds: [10, 11, 12]
          },
          {
            id: 5,
            name: "Ridhi",
            grade: "5th Grade",
            avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Riley",
            bookIds: [13, 14, 15]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  return { children, loading, error };
};

/**
 * Helper function to get the suffix for grade numbers (1st, 2nd, 3rd, etc.)
 * @param {number} grade - Grade number
 * @returns {string} - Suffix for the grade number
 */
const getGradeSuffix = (grade) => {
  if (grade === 1) return 'st';
  if (grade === 2) return 'nd';
  if (grade === 3) return 'rd';
  return 'th';
};

// For backward compatibility, export a default array of children
// Components that haven't been updated to use the hook can still import this
const childrenData = [];

export default childrenData;
