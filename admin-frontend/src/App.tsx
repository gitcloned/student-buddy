import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

// Personas
import PersonaList from './pages/personas/PersonaList';
import PersonaForm from './pages/personas/PersonaForm';

// Books
import BooksList from './pages/books/BooksList';
import BookForm from './pages/books/BookForm';

// Grades
import GradeList from './pages/grades/GradeList';
import GradeForm from './pages/grades/GradeForm';

// Teachers
import TeacherList from './pages/teachers/TeacherList';
import TeacherForm from './pages/teachers/TeacherForm';

// Subjects
import SubjectList from './pages/subjects/SubjectList';
import SubjectForm from './pages/subjects/SubjectForm';

// Children
import ChildList from './pages/children/ChildList';
import ChildForm from './pages/children/ChildForm';

// Chapters
import ChapterList from './pages/chapters/ChapterList';
import ChapterForm from './pages/chapters/ChapterForm';

// Topics
import TopicList from './pages/topics/TopicList';
import TopicForm from './pages/topics/TopicForm';
import TopicPrerequisites from './pages/topics/TopicPrerequisites';

// Lesson Plans
import LessonPlanList from './pages/lesson-plans/LessonPlanList';
import LessonPlanForm from './pages/lesson-plans/LessonPlanForm';

// Lesson Sections
import LessonSectionList from './pages/lesson-sections/LessonSectionList';
import LessonSectionForm from './pages/lesson-sections/LessonSectionForm';
import SectionResourcesForm from './pages/lesson-sections/SectionResourcesForm';

// Resources
import ResourceList from './pages/resources/ResourceList';
import ResourceForm from './pages/resources/ResourceForm';

// Learning Levels
import LearningLevelList from './pages/learning-levels/LearningLevelList';
import LearningLevelForm from './pages/learning-levels/LearningLevelForm';

// Learning Indicators
import LearningIndicatorList from './pages/learning-indicators/LearningIndicatorList';
import LearningIndicatorForm from './pages/learning-indicators/LearningIndicatorForm';
import LearningIndicatorResources from './pages/learning-indicators/LearningIndicatorResources';

// Learning Progression
import LearningProgressionPage from './pages/LearningProgressionPage';

// POCs
import ChalkboardTypingEffect from './pages/pocs/ChalkboardTest';

// Bulk Import
import BulkImportPage from './pages/bulk-import/BulkImportPage';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          {/* Personas */}
          <Route path="/personas" element={<PersonaList />} />
          <Route path="/personas/new" element={<PersonaForm />} />
          <Route path="/personas/:id" element={<PersonaForm />} />
          
          {/* Books */}
          <Route path="/books" element={<BooksList />} />
          <Route path="/books/new" element={<BookForm />} />
          <Route path="/books/:id" element={<BookForm />} />
          
          {/* Grades */}
          <Route path="/grades" element={<GradeList />} />
          <Route path="/grades/new" element={<GradeForm />} />
          <Route path="/grades/:id" element={<GradeForm />} />
          
          {/* Teachers */}
          <Route path="/teachers" element={<TeacherList />} />
          <Route path="/teachers/new" element={<TeacherForm />} />
          <Route path="/teachers/:id" element={<TeacherForm />} />
          
          {/* Subjects */}
          <Route path="/subjects" element={<SubjectList />} />
          <Route path="/subjects/new" element={<SubjectForm />} />
          <Route path="/subjects/:id" element={<SubjectForm />} />
          
          {/* Children */}
          <Route path="/children" element={<ChildList />} />
          <Route path="/children/new" element={<ChildForm />} />
          <Route path="/children/:id" element={<ChildForm />} />
          
          {/* Chapters */}
          <Route path="/chapters" element={<ChapterList />} />
          <Route path="/chapters/new" element={<ChapterForm />} />
          <Route path="/chapters/:id" element={<ChapterForm />} />
          
          {/* Topics */}
          <Route path="/topics" element={<TopicList />} />
          <Route path="/topics/new" element={<TopicForm />} />
          <Route path="/topics/:id" element={<TopicForm />} />
          <Route path="/topics/:id/prerequisites" element={<TopicPrerequisites />} />
          
          {/* Lesson Plans */}
          <Route path="/lesson-plans" element={<LessonPlanList />} />
          <Route path="/lesson-plans/new" element={<LessonPlanForm />} />
          <Route path="/lesson-plans/:id" element={<LessonPlanForm />} />
          
          {/* Lesson Sections */}
          <Route path="/lesson-sections" element={<Navigate to="/lesson-plans" replace />} />
          <Route path="/lesson-plans/:planId/sections" element={<LessonSectionList />} />
          <Route path="/lesson-plans/:planId/sections/new" element={<LessonSectionForm />} />
          <Route path="/lesson-plans/:planId/sections/:sectionId" element={<LessonSectionForm />} />
          <Route path="/lesson-plans/:planId/sections/:sectionId/resources" element={<SectionResourcesForm />} />
          
          {/* Resources */}
          <Route path="/resources" element={<ResourceList />} />
          <Route path="/resources/new" element={<ResourceForm />} />
          <Route path="/resources/:id" element={<ResourceForm />} />
          
          {/* Learning Levels */}
          <Route path="/learning-levels" element={<LearningLevelList />} />
          <Route path="/learning-levels/new" element={<LearningLevelForm />} />
          <Route path="/learning-levels/:id" element={<LearningLevelForm />} />
          
          {/* Learning Indicators */}
          <Route path="/learning-indicators" element={<LearningIndicatorList />} />
          <Route path="/learning-indicators/create" element={<LearningIndicatorForm />} />
          <Route path="/learning-indicators/edit/:id" element={<LearningIndicatorForm isEditing />} />
          <Route path="/learning-indicators/:id/resources" element={<LearningIndicatorResources />} />
          
          {/* Learning Progression */}
          <Route path="/learning-progression" element={<LearningProgressionPage />} />
          
          {/* POCs */}
          <Route path="/tests/chalkboard" element={<ChalkboardTypingEffect />} />
          
          {/* Bulk Import */}
          <Route path="/bulk-import" element={<BulkImportPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;