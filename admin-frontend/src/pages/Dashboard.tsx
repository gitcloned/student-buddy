import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  personasApi, booksApi, gradesApi, teachersApi, subjectsApi,
  childrenApi, chaptersApi, topicsApi, lessonPlansApi,
  lessonSectionsApi, resourcesApi, learningLevelsApi, learningIndicatorsApi
} from '../services/api';

const Dashboard: React.FC = () => {
  const [entityCounts, setEntityCounts] = useState({
    personas: 0,
    books: 0,
    grades: 0,
    teachers: 0,
    subjects: 0,
    children: 0,
    chapters: 0,
    topics: 0,
    lessonPlans: 0,
    lessonSections: 0,
    resources: 0,
    learningLevels: 0,
    learningIndicators: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [
          personas, books, grades, teachers, subjects,
          children, chapters, topics, lessonPlans, 
          lessonSections, resources, learningLevels, learningIndicators
        ] = await Promise.all([
          personasApi.getAll(),
          booksApi.getAll(),
          gradesApi.getAll(),
          teachersApi.getAll(),
          subjectsApi.getAll(),
          childrenApi.getAll(),
          chaptersApi.getAll(),
          topicsApi.getAll(),
          lessonPlansApi.getAll(),
          lessonSectionsApi.getAll(),
          resourcesApi.getAll(),
          learningLevelsApi.getAll(),
          learningIndicatorsApi.getAll()
        ]);
        
        setEntityCounts({
          personas: personas.length,
          books: books.length,
          grades: grades.length,
          teachers: teachers.length,
          subjects: subjects.length,
          children: children.length,
          chapters: chapters.length,
          topics: topics.length,
          lessonPlans: lessonPlans.length,
          lessonSections: lessonSections.length,
          resources: resources.length,
          learningLevels: learningLevels.length,
          learningIndicators: learningIndicators.length
        });
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        <p>{error}</p>
      </div>
    );
  }

  const cardItems = [
    {
      title: 'Grades',
      count: entityCounts.grades,
      linkTo: '/grades',
      icon: '🎓'
    },
    {
      title: 'Teacher Personas',
      count: entityCounts.personas,
      linkTo: '/personas',
      icon: '👨‍🏫'
    },
    {
      title: 'Teachers',
      count: entityCounts.teachers,
      linkTo: '/teachers',
      icon: '👩‍🏫'
    },
    {
      title: 'Subjects',
      count: entityCounts.subjects,
      linkTo: '/subjects',
      icon: '📚'
    },
    {
      title: 'Children',
      count: entityCounts.children,
      linkTo: '/children',
      icon: '👶'
    },
    {
      title: 'Chapters',
      count: entityCounts.chapters,
      linkTo: '/chapters',
      icon: '📖'
    },
    {
      title: 'Topics',
      count: entityCounts.topics,
      linkTo: '/topics',
      icon: '🔍'
    },
    {
      title: 'Lesson Plans',
      count: entityCounts.lessonPlans,
      linkTo: '/lesson-plans',
      icon: '📝'
    },
    {
      title: 'Lesson Sections',
      count: entityCounts.lessonSections,
      linkTo: '/lesson-sections',
      icon: '📋'
    },
    {
      title: 'Resources',
      count: entityCounts.resources,
      linkTo: '/resources',
      icon: '🧩'
    },
    {
      title: 'Learning Levels',
      count: entityCounts.learningLevels,
      linkTo: '/learning-levels',
      icon: '📊'
    },
    {
      title: 'Learning Indicators',
      count: entityCounts.learningIndicators,
      linkTo: '/learning-indicators',
      icon: '🎯'
    },
    {
      title: 'Books & Features',
      count: entityCounts.books,
      linkTo: '/books',
      icon: '📕'
    }
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Student Buddy Admin Dashboard</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {cardItems.map((item, index) => (
          <div key={index} className="card hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-2">{item.icon}</span>
              <h3 className="text-lg font-semibold">{item.title}</h3>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold">{item.count}</div>
              <Link to={item.linkTo} className="btn btn-sm btn-primary">
                Manage
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-4">Getting Started</h3>
        <p className="mb-4">
          Welcome to the Student Buddy Admin panel. Here you can manage all entities in the educational system:
        </p>
        <ul className="list-disc pl-6 mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          <li>Grades - educational levels</li>
          <li>Teacher Personas - personality templates for teachers</li>
          <li>Teachers - instructors with specific teaching styles</li>
          <li>Subjects - academic disciplines taught to children</li>
          <li>Children - students enrolled in various subjects</li>
          <li>Chapters - larger sections of study within subjects</li>
          <li>Topics - specific areas of study within chapters</li>
          <li>Lesson Plans - structured learning materials for topics</li>
          <li>Lesson Sections - components that make up a lesson plan</li>
          <li>Resources - educational materials used in lessons</li>
          <li>Learning Levels - progress tracking for children</li>
        </ul>
        <p>
          Use the navigation menu on the left or the cards above to access different sections of the admin panel.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;