// API service for making requests to the admin-backend
import { API_BASE_URL } from '../config/api';

/**
 * Fetch data from the specified endpoint
 * @param {string} endpoint - API endpoint to fetch data from
 * @returns {Promise<any>} - Promise resolving to the fetched data
 */
const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error;
  }
};

/**
 * API service for the student buddy frontend
 */
const apiService = {
  /**
   * Fetch all children
   * @returns {Promise<Array>} - Promise resolving to array of children
   */
  getChildren: () => fetchData('/children'),
  
  /**
   * Fetch a specific child by ID
   * @param {number} id - Child ID
   * @returns {Promise<Object>} - Promise resolving to child data
   */
  getChildById: (id) => fetchData(`/children/${id}`),
  
  /**
   * Fetch all subjects
   * @returns {Promise<Array>} - Promise resolving to array of subjects
   */
  getSubjects: () => fetchData('/subjects'),
  
  /**
   * Fetch subjects for a specific grade
   * @param {number} gradeId - Grade ID
   * @returns {Promise<Array>} - Promise resolving to array of subjects for the grade
   */
  getSubjectsByGradeId: (gradeId) => fetchData(`/subjects?grade_id=${gradeId}`),
  
  /**
   * Fetch subjects for a specific child
   * @param {number} childId - Child ID
   * @returns {Promise<Array>} - Promise resolving to array of subjects for the child
   */
  getChildSubjects: (childId) => fetchData(`/children/${childId}/subjects`),
  
  /**
   * Fetch all grades
   * @returns {Promise<Array>} - Promise resolving to array of grades
   */
  getGrades: () => fetchData('/grades'),
  
  /**
   * Fetch a specific grade by ID
   * @param {number} id - Grade ID
   * @returns {Promise<Object>} - Promise resolving to grade data
   */
  getGradeById: (id) => fetchData(`/grades/${id}`),
  
  /**
   * Fetch chapters for a specific subject
   * @param {number} subjectId - Subject ID
   * @returns {Promise<Array>} - Promise resolving to array of chapters for the subject
   */
  getSubjectChapters: (subjectId) => fetchData(`/subjects/${subjectId}/chapters`),
};

export default apiService;
