import axios from 'axios';
import { TeacherPersona, Book, BookFeature } from '../types';

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
  },
};