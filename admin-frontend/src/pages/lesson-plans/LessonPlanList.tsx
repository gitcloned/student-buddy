import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lessonPlansApi, LessonPlan, topicsApi, Topic, teachersApi, Teacher, learningLevelsApi, LearningLevel } from '../../services/api';

const LessonPlanList: React.FC = () => {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [learningLevels, setLearningLevels] = useState<LearningLevel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [lessonPlansData, topicsData, teachersData, learningLevelsData] = await Promise.all([
        lessonPlansApi.getAll(),
        topicsApi.getAll(),
        teachersApi.getAll(),
        learningLevelsApi.getAll()
      ]);
      setLessonPlans(lessonPlansData);
      setTopics(topicsData);
      setTeachers(teachersData);
      setLearningLevels(learningLevelsData);
      setError(null);
    } catch (err) {
      setError('Failed to load lesson plans. Please try again.');
      console.error('Lesson plans fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this lesson plan?')) {
      try {
        await lessonPlansApi.delete(id);
        setLessonPlans(lessonPlans.filter(plan => plan.id !== id));
      } catch (err) {
        setError('Failed to delete the lesson plan. Please try again.');
        console.error('Lesson plan delete error:', err);
      }
    }
  };

  const getTopicName = (topicId: number): string => {
    const topic = topics.find(t => t.id === topicId);
    return topic ? topic.name : 'Unknown Topic';
  };

  const getTeacherName = (teacherId: number): string => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Unknown Teacher';
  };

  const getLearningLevelName = (levelId: number): string => {
    const level = learningLevels.find(l => l.id === levelId);
    if (level) {
      return `Level ${level.level}`;
    }
    return 'Unknown Level';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
        <h3 className="text-lg font-semibold">All Lesson Plans</h3>
        <Link to="/lesson-plans/new" className="btn btn-primary">
          Add New Lesson Plan
        </Link>
      </div>

      {lessonPlans.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No lesson plans found. Create your first one!</p>
          <Link to="/lesson-plans/new" className="btn btn-primary mt-4">
            Create Lesson Plan
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Topic
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Learning Level
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration (min)
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lessonPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">{plan.id}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{plan.title}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{getTopicName(plan.topic_id)}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{getTeacherName(plan.teacher_id)}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{getLearningLevelName(plan.learning_level_id)}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{plan.duration_minutes}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <Link
                      to={`/lesson-plans/${plan.id}/sections`}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Sections
                    </Link>
                    <Link
                      to={`/lesson-plans/${plan.id}`}
                      className="text-primary hover:text-primary-dark mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LessonPlanList;
