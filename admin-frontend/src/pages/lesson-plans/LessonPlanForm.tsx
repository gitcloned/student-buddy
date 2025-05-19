import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonPlansApi, topicsApi, teachersApi, LessonPlan, Topic, Teacher } from '../../services/api';

const LessonPlanForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  // Define learning levels for dropdown
  const learningLevels = [
    { value: 'Weak', label: 'Weak' },
    { value: 'Average', label: 'Average' },
    { value: 'Strong', label: 'Strong' }
  ];
  const [formValues, setFormValues] = useState<{ 
    title: string; 
    topic_id: number | string; 
    teacher_id: number | string;
    learning_level_id: number | string;
    duration_minutes: number | string;
    objectives: string;
  }>({ 
    title: '', 
    topic_id: '',
    teacher_id: '',
    learning_level_id: '',
    duration_minutes: '',
    objectives: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [topicsData, teachersData] = await Promise.all([
          topicsApi.getAll(),
          teachersApi.getAll()
        ]);
        
        setTopics(topicsData);
        setTeachers(teachersData);

        if (id && id !== 'new') {
          const lessonPlan = await lessonPlansApi.getById(parseInt(id));
          setFormValues({ 
            title: lessonPlan.title,
            topic_id: lessonPlan.topic_id,
            teacher_id: lessonPlan.teacher_id,
            learning_level_id: lessonPlan.learning_level_id,
            duration_minutes: lessonPlan.duration_minutes,
            objectives: lessonPlan.objectives
          });
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formValues.title.trim()) {
      setError('Lesson plan title is required.');
      return;
    }

    if (!formValues.topic_id) {
      setError('Topic is required.');
      return;
    }

    if (!formValues.teacher_id) {
      setError('Teacher is required.');
      return;
    }

    if (!formValues.learning_level_id) {
      setError('Learning level is required.');
      return;
    }

    if (!formValues.duration_minutes) {
      setError('Duration is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const lessonPlanData = {
        title: formValues.title,
        topic_id: Number(formValues.topic_id),
        teacher_id: Number(formValues.teacher_id),
        learning_level_id: Number(formValues.learning_level_id),
        duration_minutes: Number(formValues.duration_minutes),
        objectives: formValues.objectives
      };
      
      if (id && id !== 'new') {
        await lessonPlansApi.update(parseInt(id), lessonPlanData);
      } else {
        await lessonPlansApi.create(lessonPlanData);
      }
      
      navigate('/lesson-plans');
    } catch (err) {
      setError('Failed to save lesson plan. Please try again.');
      console.error('Lesson plan save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold mb-6">
        {id && id !== 'new' ? 'Edit Lesson Plan' : 'Add New Lesson Plan'}
      </h3>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            Lesson Plan Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formValues.title}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter lesson plan title"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="topic_id">
            Topic
          </label>
          <select
            id="topic_id"
            name="topic_id"
            value={formValues.topic_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a topic</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="teacher_id">
            Teacher
          </label>
          <select
            id="teacher_id"
            name="teacher_id"
            value={formValues.teacher_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="learning_level_id">
            Learning Level
          </label>
          <select
            id="learning_level_id"
            name="learning_level_id"
            value={formValues.learning_level_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a learning level</option>
            {learningLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duration_minutes">
            Duration (minutes)
          </label>
          <input
            type="number"
            id="duration_minutes"
            name="duration_minutes"
            value={formValues.duration_minutes}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter duration in minutes"
            min="1"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="objectives">
            Learning Objectives
          </label>
          <textarea
            id="objectives"
            name="objectives"
            value={formValues.objectives}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter learning objectives"
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate('/lesson-plans')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Lesson Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LessonPlanForm;
