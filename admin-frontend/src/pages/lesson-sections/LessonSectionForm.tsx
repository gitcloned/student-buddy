import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { lessonSectionsApi, lessonPlansApi, LessonPlan } from '../../services/api';

const LessonSectionForm: React.FC = () => {
  const { planId, sectionId } = useParams<{ planId: string; sectionId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [formValues, setFormValues] = useState<{ 
    lesson_plan_id: number;
    type: string; 
    teaching_pedagogy: string; 
    duration_minutes: number | string;
    order_index: number | string;
  }>({ 
    lesson_plan_id: 0,
    type: '', 
    teaching_pedagogy: '',
    duration_minutes: '',
    order_index: ''
  });

  // Define section types
  const sectionTypes = [
    'Introduction',
    'I Do',
    'We Do',
    'You Do',
    'Assessment',
    'Homework'
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!planId) {
        navigate('/lesson-plans');
        return;
      }

      const planIdNumber = parseInt(planId);
      
      try {
        setIsLoading(true);
        const lessonPlanData = await lessonPlansApi.getById(planIdNumber);
        setLessonPlan(lessonPlanData);
        
        if (sectionId && sectionId !== 'new') {
          const section = await lessonSectionsApi.getById(parseInt(sectionId));
          setFormValues({ 
            lesson_plan_id: planIdNumber,
            type: section.type,
            teaching_pedagogy: section.teaching_pedagogy || '',
            duration_minutes: section.duration_minutes,
            order_index: section.order_index || ''
          });
        } else {
          // For new sections, set the lesson plan ID and suggest the next order index
          const sections = await lessonPlansApi.getSections(planIdNumber);
          const nextOrderIndex = sections.length > 0 ? 
            Math.max(...sections.map(s => s.order_index || 0)) + 1 : 1;
          
          setFormValues(prev => ({ 
            ...prev, 
            lesson_plan_id: planIdNumber,
            order_index: nextOrderIndex
          }));
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
  }, [planId, sectionId, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formValues.type.trim()) {
      setError('Section type is required.');
      return;
    }

    if (!formValues.duration_minutes) {
      setError('Duration is required.');
      return;
    }

    if (!formValues.order_index) {
      setError('Order index is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const sectionData = {
        lesson_plan_id: formValues.lesson_plan_id,
        type: formValues.type,
        teaching_pedagogy: formValues.teaching_pedagogy,
        duration_minutes: Number(formValues.duration_minutes),
        order_index: Number(formValues.order_index)
      };
      
      if (sectionId && sectionId !== 'new') {
        await lessonSectionsApi.update(parseInt(sectionId), sectionData);
      } else {
        await lessonSectionsApi.create(sectionData);
      }
      
      navigate(`/lesson-plans/${planId}/sections`);
    } catch (err) {
      setError('Failed to save section. Please try again.');
      console.error('Section save error:', err);
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

  if (!lessonPlan) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        <p>Lesson plan not found.</p>
        <Link to="/lesson-plans" className="text-red-700 font-bold underline">
          Return to Lesson Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link to={`/lesson-plans/${planId}/sections`} className="text-blue-500 hover:underline mb-2 inline-block">
          &larr; Back to Sections
        </Link>
        <h3 className="text-lg font-semibold">
          {sectionId && sectionId !== 'new' ? 'Edit Section' : 'Add New Section'} for {lessonPlan.title}
        </h3>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
            Section Type
          </label>
          <input
            type="text"
            id="type"
            name="type"
            value={formValues.type}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter section type"
            list="section-type-suggestions"
          />
          <datalist id="section-type-suggestions">
            {sectionTypes.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-wrap -mx-2 mb-4">
          <div className="w-1/2 px-2">
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
          <div className="w-1/2 px-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="order_index">
              Order Index
            </label>
            <input
              type="number"
              id="order_index"
              name="order_index"
              value={formValues.order_index}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter order index"
              min="1"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
            Content/Instructions
          </label>
          <textarea
            id="teaching_pedagogy"
            name="teaching_pedagogy"
            value={formValues.teaching_pedagogy}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter section content and instructions"
            rows={6}
          />
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate(`/lesson-plans/${planId}/sections`)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Section'}
          </button>
        </div>
      </form>

      {sectionId && sectionId !== 'new' && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg shadow-sm">
          <p className="font-medium text-blue-800">Resource Management</p>
          <p className="text-sm text-blue-600 mb-3">After saving this section, you can manage its resources.</p>
          <Link 
            to={`/lesson-plans/${planId}/sections/${sectionId}/resources`}
            className="text-blue-700 hover:text-blue-900 font-medium text-sm underline"
          >
            Manage Section Resources
          </Link>
        </div>
      )}
    </div>
  );
};

export default LessonSectionForm;
