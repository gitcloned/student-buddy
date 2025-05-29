import axios from 'axios';
import { 
  TeacherPersona, Book, BookFeature, Grade, Teacher, Subject, Child, 
  Chapter, Topic, TopicPrerequisite, LessonPlan, LessonSection, 
  Resource, SectionResource, LearningLevel, LearningIndicator, LearningIndicatorResource 
} from '../types';

// Re-export all the types for components to use
export type { 
  TeacherPersona, Book, BookFeature, Grade, Teacher, Subject, Child, 
  Chapter, Topic, TopicPrerequisite, LessonPlan, LessonSection, 
  Resource, SectionResource, LearningLevel, LearningIndicator, LearningIndicatorResource 
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

// API client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Teacher Personas API
export const personasApi = {
  getAll: async (): Promise<TeacherPersona[]> => {
    const response = await apiClient.get('/personas');
    return response.data;
  },
  
  getById: async (id: number): Promise<TeacherPersona> => {
    const response = await apiClient.get(`/personas/${id}`);
    return response.data;
  },
  
  create: async (persona: TeacherPersona): Promise<TeacherPersona> => {
    const response = await apiClient.post('/personas', persona);
    return response.data;
  },
  
  update: async (id: number, persona: TeacherPersona): Promise<TeacherPersona> => {
    const response = await apiClient.put(`/personas/${id}`, persona);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/personas/${id}`);
  },
};

// Books API
export const booksApi = {
  getAll: async (): Promise<Book[]> => {
    const response = await apiClient.get('/books');
    return response.data;
  },
  
  getById: async (id: number): Promise<Book> => {
    const response = await apiClient.get(`/books/${id}`);
    return response.data;
  },
  
  create: async (): Promise<Book> => {
    const response = await apiClient.post('/books');
    return response.data;
  },
  
  update: async (id: number, book: Book): Promise<Book> => {
    const response = await apiClient.put(`/books/${id}`, book);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/books/${id}`);
  },
  
  createFeature: async (bookId: number, feature: BookFeature): Promise<BookFeature> => {
    const response = await apiClient.post(`/books/${bookId}/features`, {
      subject: feature.subject,
      name: feature.name,
      how_to_teach: feature.how_to_teach
    });
    return response.data;
  },
  
  updateFeature: async (id: number, feature: BookFeature): Promise<BookFeature> => {
    const response = await apiClient.put(`/features/${id}`, {
      subject: feature.subject,
      name: feature.name,
      how_to_teach: feature.how_to_teach
    });
    return response.data;
  },
};

// Book Features API
export const featuresApi = {
  create: async (bookId: number, feature: BookFeature): Promise<BookFeature> => {
    const response = await apiClient.post(`/books/${bookId}/features`, {
      subject: feature.subject,
      name: feature.name,
      howToTeach: feature.how_to_teach
    });
    return response.data;
  },
  
  update: async (id: number, feature: BookFeature): Promise<BookFeature> => {
    const response = await apiClient.put(`/features/${id}`, {
      subject: feature.subject,
      name: feature.name,
      howToTeach: feature.how_to_teach
    });
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/features/${id}`);
  }
};

// Grades API
export const gradesApi = {
  getAll: async (): Promise<Grade[]> => {
    const response = await apiClient.get('/grades');
    return response.data;
  },
  
  getById: async (id: number): Promise<Grade> => {
    const response = await apiClient.get(`/grades/${id}`);
    return response.data;
  },
  
  create: async (grade: { name: string }): Promise<Grade> => {
    const response = await apiClient.post('/grades', grade);
    return response.data;
  },
  
  update: async (id: number, grade: { name: string }): Promise<Grade> => {
    const response = await apiClient.put(`/grades/${id}`, grade);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/grades/${id}`);
  },
};

// Teachers API
export const teachersApi = {
  getAll: async (): Promise<Teacher[]> => {
    const response = await apiClient.get('/teachers');
    return response.data;
  },
  
  getById: async (id: number): Promise<Teacher> => {
    const response = await apiClient.get(`/teachers/${id}`);
    return response.data;
  },
  
  create: async (teacher: { name: string, persona_id: number, teaching_style: string }): Promise<Teacher> => {
    const response = await apiClient.post('/teachers', teacher);
    return response.data;
  },
  
  update: async (id: number, teacher: { name: string, persona_id: number, teaching_style: string }): Promise<Teacher> => {
    const response = await apiClient.put(`/teachers/${id}`, teacher);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/teachers/${id}`);
  },
  
  getSubjects: async (id: number): Promise<Subject[]> => {
    const response = await apiClient.get(`/teachers/${id}/subjects`);
    return response.data;
  },
  
  assignSubject: async (id: number, subject_id: number): Promise<{ teacher_id: number, subject_id: number }> => {
    const response = await apiClient.post(`/teachers/${id}/subjects`, { subject_id });
    return response.data;
  },
  
  removeSubject: async (id: number, subject_id: number): Promise<void> => {
    await apiClient.delete(`/teachers/${id}/subjects/${subject_id}`);
  },
};

// Subjects API
export const subjectsApi = {
  getAll: async (): Promise<Subject[]> => {
    const response = await apiClient.get('/subjects');
    return response.data;
  },
  
  getById: async (id: number): Promise<Subject> => {
    const response = await apiClient.get(`/subjects/${id}`);
    return response.data;
  },
  
  create: async (subject: { name: string, grade_id: number }): Promise<Subject> => {
    const response = await apiClient.post('/subjects', subject);
    return response.data;
  },
  
  update: async (id: number, subject: { name: string, grade_id: number }): Promise<Subject> => {
    const response = await apiClient.put(`/subjects/${id}`, subject);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/subjects/${id}`);
  },
};

// Children API
export const childrenApi = {
  getAll: async (): Promise<Child[]> => {
    const response = await apiClient.get('/children');
    return response.data;
  },
  
  getById: async (id: number): Promise<Child> => {
    const response = await apiClient.get(`/children/${id}`);
    return response.data;
  },
  
  create: async (child: { name: string, grade_id: number }): Promise<Child> => {
    const response = await apiClient.post('/children', child);
    return response.data;
  },
  
  update: async (id: number, child: { name: string, grade_id: number }): Promise<Child> => {
    const response = await apiClient.put(`/children/${id}`, child);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/children/${id}`);
  },
  
  getSubjects: async (id: number): Promise<Subject[]> => {
    const response = await apiClient.get(`/children/${id}/subjects`);
    return response.data;
  },
  
  enrollInSubject: async (id: number, subject_id: number): Promise<{ child_id: number, subject_id: number }> => {
    const response = await apiClient.post(`/children/${id}/subjects`, { subject_id });
    return response.data;
  },
  
  removeFromSubject: async (id: number, subject_id: number): Promise<void> => {
    await apiClient.delete(`/children/${id}/subjects/${subject_id}`);
  },
  
  getLessonPlans: async (id: number): Promise<LessonPlan[]> => {
    const response = await apiClient.get(`/children/${id}/lesson-plans`);
    return response.data;
  },
  
  getLearningLevels: async (id: number): Promise<LearningLevel[]> => {
    const response = await apiClient.get(`/children/${id}/learning-levels`);
    return response.data;
  },
};

// Chapters API
export const chaptersApi = {
  getAll: async (): Promise<Chapter[]> => {
    const response = await apiClient.get('/chapters');
    return response.data;
  },
  
  getById: async (id: number): Promise<Chapter> => {
    const response = await apiClient.get(`/chapters/${id}`);
    return response.data;
  },
  
  getBySubject: async (subject_id: number): Promise<Chapter[]> => {
    const response = await apiClient.get(`/subjects/${subject_id}/chapters`);
    return response.data;
  },
  
  create: async (chapter: { name: string, subject_id: number }): Promise<Chapter> => {
    const response = await apiClient.post('/chapters', chapter);
    return response.data;
  },
  
  update: async (id: number, chapter: { name: string, subject_id: number }): Promise<Chapter> => {
    const response = await apiClient.put(`/chapters/${id}`, chapter);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/chapters/${id}`);
  },
};

// Topics API
export const topicsApi = {
  getAll: async (): Promise<Topic[]> => {
    const response = await apiClient.get('/topics');
    return response.data;
  },
  
  getById: async (id: number): Promise<Topic> => {
    const response = await apiClient.get(`/topics/${id}`);
    return response.data;
  },
  
  getByChapter: async (chapter_id: number): Promise<Topic[]> => {
    const response = await apiClient.get(`/chapters/${chapter_id}/topics`);
    return response.data;
  },
  
  create: async (topic: { name: string, chapter_id: number }): Promise<Topic> => {
    const response = await apiClient.post('/topics', topic);
    return response.data;
  },
  
  update: async (id: number, topic: { name: string, chapter_id: number }): Promise<Topic> => {
    const response = await apiClient.put(`/topics/${id}`, topic);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/topics/${id}`);
  },
  
  getPrerequisites: async (id: number): Promise<Topic[]> => {
    const response = await apiClient.get(`/topics/${id}/prerequisites`);
    return response.data;
  },
  
  addPrerequisite: async (id: number, prerequisite_topic_id: number): Promise<TopicPrerequisite> => {
    const response = await apiClient.post(`/topics/${id}/prerequisites`, { prerequisite_topic_id });
    return response.data;
  },
  
  removePrerequisite: async (id: number, prerequisite_id: number): Promise<void> => {
    await apiClient.delete(`/topics/${id}/prerequisites/${prerequisite_id}`);
  },
  
  getLessonPlans: async (id: number): Promise<LessonPlan[]> => {
    const response = await apiClient.get(`/topics/${id}/lesson-plans`);
    return response.data;
  },
  
  getLearningLevels: async (id: number): Promise<LearningLevel[]> => {
    const response = await apiClient.get(`/topics/${id}/learning-levels`);
    return response.data;
  },
};

// Lesson Plans API
export const lessonPlansApi = {
  getAll: async (): Promise<LessonPlan[]> => {
    const response = await apiClient.get('/lesson-plans');
    return response.data;
  },
  
  getById: async (id: number): Promise<LessonPlan> => {
    const response = await apiClient.get(`/lesson-plans/${id}`);
    return response.data;
  },
  
  getByTopic: async (topic_id: number): Promise<LessonPlan[]> => {
    const response = await apiClient.get(`/topics/${topic_id}/lesson-plans`);
    return response.data;
  },
  
  getByTeacher: async (teacher_id: number): Promise<LessonPlan[]> => {
    const response = await apiClient.get(`/teachers/${teacher_id}/lesson-plans`);
    return response.data;
  },
  
  create: async (lessonPlan: { 
    title: string, 
    topic_id: number, 
    teacher_id: number, 
    learning_level_id: number, 
    duration_minutes: number,
    objectives: string
  }): Promise<LessonPlan> => {
    const response = await apiClient.post('/lesson-plans', lessonPlan);
    return response.data;
  },
  
  update: async (id: number, lessonPlan: { 
    title: string, 
    topic_id: number, 
    teacher_id: number, 
    learning_level_id: number, 
    duration_minutes: number,
    objectives: string
  }): Promise<LessonPlan> => {
    const response = await apiClient.put(`/lesson-plans/${id}`, lessonPlan);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/lesson-plans/${id}`);
  },
  
  getSections: async (id: number): Promise<LessonSection[]> => {
    const response = await apiClient.get(`/lesson-plans/${id}/sections`);
    return response.data;
  },
};

// Lesson Sections API
export const lessonSectionsApi = {
  getAll: async (): Promise<LessonSection[]> => {
    const response = await apiClient.get('/lesson-sections');
    return response.data;
  },
  
  getById: async (id: number): Promise<LessonSection> => {
    const response = await apiClient.get(`/lesson-sections/${id}`);
    return response.data;
  },
  
  getByLessonPlan: async (lessonPlanId: number): Promise<LessonSection[]> => {
    const response = await apiClient.get(`/lesson-plans/${lessonPlanId}/sections`);
    return response.data;
  },
  
  create: async (section: { 
    lesson_plan_id: number, 
    type: string, 
    teaching_pedagogy: string, 
    duration_minutes: number,
    order_index: number
  }): Promise<LessonSection> => {
    const response = await apiClient.post('/lesson-sections', section);
    return response.data;
  },
  
  update: async (id: number, section: { 
    lesson_plan_id: number, 
    type: string, 
    teaching_pedagogy: string, 
    duration_minutes: number,
    order_index: number
  }): Promise<LessonSection> => {
    const response = await apiClient.put(`/lesson-sections/${id}`, section);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/lesson-sections/${id}`);
  },
  
  getResources: async (id: number): Promise<Resource[]> => {
    const response = await apiClient.get(`/lesson-sections/${id}/resources`);
    return response.data;
  },
  
  addResource: async (id: number, resource_id: number): Promise<SectionResource> => {
    const response = await apiClient.post(`/lesson-sections/${id}/resources`, { resource_id });
    return response.data;
  },
  
  removeResource: async (id: number, resource_id: number): Promise<void> => {
    await apiClient.delete(`/lesson-sections/${id}/resources/${resource_id}`);
  },
};

// Resources API
export const resourcesApi = {
  getAll: async (): Promise<Resource[]> => {
    const response = await apiClient.get('/resources');
    return response.data;
  },
  
  getById: async (id: number): Promise<Resource> => {
    const response = await apiClient.get(`/resources/${id}`);
    return response.data;
  },
  
  create: async (resource: { 
    title: string, 
    type: string, 
    url: string, 
    description: string
  }): Promise<Resource> => {
    const response = await apiClient.post('/resources', resource);
    return response.data;
  },
  
  update: async (id: number, resource: { 
    title: string, 
    type: string, 
    url: string, 
    description: string
  }): Promise<Resource> => {
    const response = await apiClient.put(`/resources/${id}`, resource);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/resources/${id}`);
  },
};

// Learning Indicators API
export const learningIndicatorsApi = {
  getAll: async (): Promise<LearningIndicator[]> => {
    const response = await apiClient.get('/learning-indicators');
    return response.data;
  },
  
  getById: async (id: number): Promise<LearningIndicator> => {
    const response = await apiClient.get(`/learning-indicators/${id}`);
    return response.data;
  },
  
  getByTopic: async (topicId: number): Promise<LearningIndicator[]> => {
    const response = await apiClient.get(`/topics/${topicId}/learning-indicators`);
    return response.data;
  },
  
  create: async (indicator: { 
    title: string, 
    topic_id: number 
  }): Promise<LearningIndicator> => {
    const response = await apiClient.post('/learning-indicators', indicator);
    return response.data;
  },
  
  update: async (id: number, indicator: { 
    title: string, 
    topic_id: number 
  }): Promise<LearningIndicator> => {
    const response = await apiClient.put(`/learning-indicators/${id}`, indicator);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/learning-indicators/${id}`);
  },
  
  getResources: async (id: number): Promise<Resource[]> => {
    const response = await apiClient.get(`/learning-indicators/${id}/resources`);
    return response.data;
  },
  
  addResource: async (id: number, resource_id: number): Promise<LearningIndicatorResource> => {
    const response = await apiClient.post(`/learning-indicators/${id}/resources`, { resource_id });
    return response.data;
  },
  
  removeResource: async (id: number, resource_id: number): Promise<void> => {
    await apiClient.delete(`/learning-indicators/${id}/resources/${resource_id}`);
  },
};

// Learning Levels API
export const learningLevelsApi = {
  getAll: async (): Promise<LearningLevel[]> => {
    const response = await apiClient.get('/learning-levels');
    return response.data;
  },
  
  getById: async (id: number): Promise<LearningLevel> => {
    const response = await apiClient.get(`/learning-levels/${id}`);
    return response.data;
  },
  
  getByTopic: async (topicId: number): Promise<LearningLevel[]> => {
    const response = await apiClient.get(`/topics/${topicId}/learning-levels`);
    return response.data;
  },
  
  getByChild: async (childId: number): Promise<LearningLevel[]> => {
    const response = await apiClient.get(`/children/${childId}/learning-levels`);
    return response.data;
  },
  
  create: async (level: { 
    child_id: number, 
    topic_id: number, 
    level: string, 
    notes: string
  }): Promise<LearningLevel> => {
    const response = await apiClient.post('/learning-levels', level);
    return response.data;
  },
  
  update: async (id: number, level: { 
    child_id: number, 
    topic_id: number, 
    level: string, 
    notes: string
  }): Promise<LearningLevel> => {
    const response = await apiClient.put(`/learning-levels/${id}`, level);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/learning-levels/${id}`);
  },
};