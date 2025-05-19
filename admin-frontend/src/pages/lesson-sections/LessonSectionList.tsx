import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { lessonSectionsApi, lessonPlansApi, LessonSection, LessonPlan } from '../../services/api';

const LessonSectionList: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!planId) {
      navigate('/lesson-plans');
      return;
    }

    try {
      setIsLoading(true);
      const [lessonPlanData, sectionsData] = await Promise.all([
        lessonPlansApi.getById(parseInt(planId)),
        lessonPlansApi.getSections(parseInt(planId))
      ]);
      setLessonPlan(lessonPlanData);
      // Sort sections by order_index
      const sortedSections = [...sectionsData].sort((a, b) => 
        (a.order_index || 0) - (b.order_index || 0)
      );
      setSections(sortedSections);
      setError(null);
    } catch (err) {
      setError('Failed to load lesson sections. Please try again.');
      console.error('Lesson sections fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [planId]);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this section?')) {
      try {
        await lessonSectionsApi.delete(id);
        setSections(sections.filter(section => section.id !== id));
      } catch (err) {
        setError('Failed to delete the section. Please try again.');
        console.error('Section delete error:', err);
      }
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
    <div>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/lesson-plans" className="text-blue-500 hover:underline mb-2 inline-block">
            &larr; Back to Lesson Plans
          </Link>
          <h3 className="text-lg font-semibold">Sections for: {lessonPlan.title}</h3>
        </div>
        <Link to={`/lesson-plans/${planId}/sections/new`} className="btn btn-primary">
          Add New Section
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h4 className="font-medium text-gray-700">Lesson Plan Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <p><span className="font-semibold">Title:</span> {lessonPlan.title}</p>
            <p><span className="font-semibold">Duration:</span> {lessonPlan.duration_minutes} minutes</p>
          </div>
          <div>
            <p><span className="font-semibold">Objectives:</span> {lessonPlan.objectives}</p>
          </div>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No sections found for this lesson plan. Create your first one!</p>
          <Link to={`/lesson-plans/${planId}/sections/new`} className="btn btn-primary mt-4">
            Create Section
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={section.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-b">
                <div className="flex items-center">
                  <span className="bg-gray-200 text-gray-700 rounded-full h-6 w-6 flex items-center justify-center mr-2">
                    {section.order_index || index + 1}
                  </span>
                  <h4 className="font-medium">{section.type}</h4>
                </div>
                <div className="text-sm text-gray-500">{section.duration_minutes} minutes</div>
              </div>
              <div className="p-4">
                <div className="mb-3">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{section.teaching_pedagogy}</p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Link
                    to={`/lesson-plans/${planId}/sections/${section.id}/resources`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Resources
                  </Link>
                  <Link
                    to={`/lesson-plans/${planId}/sections/${section.id}`}
                    className="text-primary hover:text-primary-dark text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(section.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LessonSectionList;
