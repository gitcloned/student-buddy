import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

/**
 * Get an appropriate icon for a subject based on its name
 * @param {string} subjectName - Name of the subject
 * @returns {string} - Emoji icon for the subject
 */
const getSubjectIcon = (subjectName) => {
  const name = subjectName.toLowerCase();
  if (name.includes('math')) return '📐';
  if (name.includes('english') || name.includes('language')) return '📚';
  if (name.includes('science')) return '🔬';
  if (name.includes('history') || name.includes('social')) return '🌍';
  if (name.includes('art')) return '🎨';
  if (name.includes('music')) return '🎵';
  if (name.includes('computer') || name.includes('tech')) return '💻';
  if (name.includes('physical') || name.includes('sport')) return '⚽';
  return '📖'; // Default icon
};

/**
 * Generate a description for a subject based on its name and grade
 * @param {string} subjectName - Name of the subject
 * @param {number} gradeId - Grade ID
 * @param {string} gradeName - Grade name (optional)
 * @returns {string} - Description for the subject
 */
const generateDescription = (subjectName, gradeId, gradeName = null) => {
  const name = subjectName.toLowerCase();
  const gradeDisplay = gradeName || `grade ${gradeId}`;
  
  if (name.includes('math')) {
    if (gradeId === 1) return 'Learn numbers, counting, and basic math operations';
    if (gradeId === 2) return 'Learn addition, subtraction, and basic geometry';
    if (gradeId === 3) return 'Learn multiplication, division, and fractions';
    if (gradeId === 4) return 'Learn decimals, percentages, and problem-solving';
    if (gradeId === 5) return 'Learn algebra, geometry, and data analysis';
    return `Mathematics curriculum for ${gradeDisplay}`;
  }
  
  if (name.includes('english') || name.includes('language')) {
    if (gradeId === 1) return 'Learn reading, writing, and vocabulary';
    if (gradeId === 2) return 'Develop reading comprehension and writing skills';
    if (gradeId === 3) return 'Improve grammar, vocabulary, and creative writing';
    if (gradeId === 4) return 'Develop advanced reading and writing skills';
    if (gradeId === 5) return 'Master complex texts and essay writing';
    return `English language curriculum for ${gradeDisplay}`;
  }
  
  if (name.includes('science')) {
    if (gradeId === 1) return 'Explore nature, animals, and simple experiments';
    if (gradeId === 2) return 'Learn about plants, animals, and the environment';
    if (gradeId === 3) return 'Study the human body, weather, and simple machines';
    if (gradeId === 4) return 'Explore ecosystems, matter, and energy';
    if (gradeId === 5) return 'Study earth science, chemistry, and physics';
    return `Science curriculum for ${gradeDisplay}`;
  }
  
  return `${subjectName} curriculum for ${gradeDisplay}`;
};

/**
 * Custom hook to fetch all subjects data from the API
 * @returns {Object} - Object containing subjects data and loading state
 */
export const useSubjectsData = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        
        // Fetch both subjects and grades data in parallel
        const [subjectsData, gradesData] = await Promise.all([
          apiService.getSubjects(),
          apiService.getGrades()
        ]);
        
        // Create a map of grade_id to grade name for easy lookup
        const gradesMap = {};
        gradesData.forEach(grade => {
          gradesMap[grade.id] = grade.name || `Grade ${grade.id}`;
        });
        
        // Transform the data to match the expected format
        const transformedData = subjectsData.map(subject => {
          // Get the grade name from the map, or use the grade_id as fallback
          const gradeName = subject.grade_id && gradesMap[subject.grade_id] 
            ? gradesMap[subject.grade_id] 
            : `Grade ${subject.grade_id}`;
            
          return {
            id: subject.id,
            name: subject.name,
            icon: getSubjectIcon(subject.name),
            description: subject.description || generateDescription(subject.name, subject.grade_id, gradeName),
            gradeId: subject.grade_id,
            gradeName: gradeName
          };
        });
        
        setSubjects(transformedData);
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
        setError(err.message);
        
        // Fallback to mock data in case of error
        setSubjects(MOCK_SUBJECTS_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return { subjects, loading, error };
};

/**
 * Custom hook to fetch subjects data for a specific grade from the API
 * @param {number} gradeId - Grade ID to fetch subjects for
 * @returns {Object} - Object containing subjects data and loading state
 */
export const useSubjectsByGradeId = (gradeId) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjectsByGrade = async () => {
      if (!gradeId) {
        setSubjects([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch grade information first to get the proper grade name
        let gradeName = `Grade ${gradeId}`;
        try {
          const gradeData = await apiService.getGradeById(gradeId);
          if (gradeData && gradeData.name) {
            gradeName = gradeData.name;
          }
        } catch (gradeErr) {
          console.warn(`Could not fetch grade info for grade ${gradeId}:`, gradeErr);
          // Continue with default grade name
        }
        
        // Use the API service to fetch subjects by grade ID
        const data = await apiService.getSubjectsByGradeId(gradeId);
        
        // Transform the data to match the expected format
        const transformedData = data.map(subject => ({
          id: subject.id,
          name: subject.name,
          icon: getSubjectIcon(subject.name),
          description: subject.description || generateDescription(subject.name, gradeId, gradeName),
          gradeId: subject.grade_id,
          gradeName: gradeName
        }));
        
        setSubjects(transformedData);
      } catch (err) {
        console.error(`Failed to fetch subjects for grade ${gradeId}:`, err);
        setError(err.message);
        
        // Fallback to mock data in case of error
        setSubjects(MOCK_SUBJECTS_DATA.filter(subject => subject.gradeId === gradeId));
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectsByGrade();
  }, [gradeId]);

  return { subjects, loading, error };
};

// Mock data for fallback in case of API errors
const MOCK_SUBJECTS_DATA = [
  {
    id: 1,
    name: "Mathematics",
    icon: "📐",
    description: "Learn numbers, counting, and basic math operations",
    gradeId: 1
  },
  {
    id: 2,
    name: "English",
    icon: "📚",
    description: "Learn reading, writing, and vocabulary",
    gradeId: 1
  },
  {
    id: 3,
    name: "Science",
    icon: "🔬",
    description: "Explore nature, animals, and simple experiments",
    gradeId: 1
  },
  {
    id: 4,
    name: "Mathematics",
    icon: "📐",
    description: "Learn addition, subtraction, and basic geometry",
    gradeId: 2
  },
  {
    id: 5,
    name: "English",
    icon: "📚",
    description: "Develop reading comprehension and writing skills",
    gradeId: 2
  },
  {
    id: 6,
    name: "Science",
    icon: "🔬",
    description: "Learn about plants, animals, and the environment",
    gradeId: 2
  },
  {
    id: 7,
    name: "Mathematics",
    icon: "📐",
    description: "Learn multiplication, division, and fractions",
    gradeId: 3
  },
  {
    id: 8,
    name: "English",
    icon: "📚",
    description: "Improve grammar, vocabulary, and creative writing",
    gradeId: 3
  },
  {
    id: 9,
    name: "Science",
    icon: "🔬",
    description: "Study the human body, weather, and simple machines",
    gradeId: 3
  },
  {
    id: 10,
    name: "Mathematics",
    icon: "📐",
    description: "Learn decimals, percentages, and problem-solving",
    gradeId: 4
  },
  {
    id: 11,
    name: "English",
    icon: "📚",
    description: "Develop advanced reading and writing skills",
    gradeId: 4
  },
  {
    id: 12,
    name: "Science",
    icon: "🔬",
    description: "Explore ecosystems, matter, and energy",
    gradeId: 4
  },
  {
    id: 13,
    name: "Mathematics",
    icon: "📐",
    description: "Learn algebra, geometry, and data analysis",
    gradeId: 5
  },
  {
    id: 14,
    name: "English",
    icon: "📚",
    description: "Master complex texts and essay writing",
    gradeId: 5
  },
  {
    id: 15,
    name: "Science",
    icon: "🔬",
    description: "Study earth science, chemistry, and physics",
    gradeId: 5
  }
];

// For backward compatibility, export a default array of subjects
// Components that haven't been updated to use the hook can still import this
const subjectsData = [];

export default subjectsData;
