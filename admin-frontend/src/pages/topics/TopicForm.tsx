import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { topicsApi, chaptersApi, subjectsApi, gradesApi, Chapter, Subject, Grade } from '../../services/api';

const TopicForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  // Filters
  const [selectedGradeId, setSelectedGradeId] = useState<number | ''>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  
  // Form values
  const [formValues, setFormValues] = useState<{ name: string; chapter_ids: number[] }>({ 
    name: '', 
    chapter_ids: [] 
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [gradesData, subjectsData, chaptersData] = await Promise.all([
          gradesApi.getAll(),
          subjectsApi.getAll(),
          chaptersApi.getAll()
        ]);
        setGrades(gradesData);
        setSubjects(subjectsData);
        setChapters(chaptersData);

        if (id && id !== 'new') {
          const topic = await topicsApi.getById(parseInt(id));
          setFormValues({ 
            name: topic.name,
            chapter_ids: topic.chapter_ids || []
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

  // Filter subjects based on selected grade
  const filteredSubjects = useMemo(() => {
    if (!selectedGradeId) return subjects;
    return subjects.filter(s => s.grade_id === selectedGradeId);
  }, [subjects, selectedGradeId]);

  // Filter chapters based on selected subject (and indirectly grade)
  const filteredChapters = useMemo(() => {
    if (!selectedSubjectId) {
      if (!selectedGradeId) return chapters;
      // If only grade is selected, show chapters for all subjects in that grade
      const subjectIdsInGrade = subjects.filter(s => s.grade_id === selectedGradeId).map(s => s.id);
      return chapters.filter(c => subjectIdsInGrade.includes(c.subject_id));
    }
    return chapters.filter(c => c.subject_id === selectedSubjectId);
  }, [chapters, subjects, selectedGradeId, selectedSubjectId]);

  // Get chapter details with subject and grade info
  const getChapterDetails = (chapterId: number) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return null;
    const subject = subjects.find(s => s.id === chapter.subject_id);
    const grade = subject ? grades.find(g => g.id === subject.grade_id) : null;
    return { chapter, subject, grade };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleGradeChange = (gradeId: number | '') => {
    setSelectedGradeId(gradeId);
    setSelectedSubjectId(''); // Reset subject when grade changes
  };

  const handleChapterToggle = (chapterId: number) => {
    setFormValues(prev => {
      const isSelected = prev.chapter_ids.includes(chapterId);
      if (isSelected) {
        return { ...prev, chapter_ids: prev.chapter_ids.filter(id => id !== chapterId) };
      } else {
        return { ...prev, chapter_ids: [...prev.chapter_ids, chapterId] };
      }
    });
  };

  const handleRemoveChapter = (chapterId: number) => {
    setFormValues(prev => ({
      ...prev,
      chapter_ids: prev.chapter_ids.filter(id => id !== chapterId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formValues.name.trim()) {
      setError('Topic name is required.');
      return;
    }

    if (formValues.chapter_ids.length === 0) {
      setError('At least one chapter is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const topicData = {
        name: formValues.name,
        chapter_ids: formValues.chapter_ids
      };
      
      if (id && id !== 'new') {
        await topicsApi.update(parseInt(id), topicData);
      } else {
        await topicsApi.create(topicData);
      }
      
      navigate('/topics');
    } catch (err) {
      setError('Failed to save topic. Please try again.');
      console.error('Topic save error:', err);
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
        {id && id !== 'new' ? 'Edit Topic' : 'Add New Topic'}
      </h3>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Topic Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter topic name"
          />
        </div>

        {/* Selected Chapters Section */}
        {formValues.chapter_ids.length > 0 && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Selected Chapters ({formValues.chapter_ids.length})
            </label>
            <div className="shadow border rounded w-full py-2 px-3 bg-gray-50 max-h-32 overflow-y-auto">
              {formValues.chapter_ids.map((chapterId) => {
                const details = getChapterDetails(chapterId);
                if (!details) return null;
                return (
                  <div key={chapterId} className="flex items-center justify-between py-1 px-2 mb-1 bg-white rounded border">
                    <span className="text-gray-700 text-sm">
                      {details.chapter.name}
                      <span className="text-gray-400 text-xs ml-2">
                        ({details.subject?.name || 'Unknown'}, {details.grade?.name || 'Unknown'})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChapter(chapterId)}
                      className="text-red-500 hover:text-red-700 ml-2 font-bold"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chapter Selection with Filters */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Add Chapters
          </label>
          
          {/* Filter Dropdowns */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-gray-600 text-xs mb-1">Filter by Grade</label>
              <select
                value={selectedGradeId}
                onChange={(e) => handleGradeChange(e.target.value ? Number(e.target.value) : '')}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">All Grades</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-gray-600 text-xs mb-1">Filter by Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : '')}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm leading-tight focus:outline-none focus:shadow-outline"
                disabled={filteredSubjects.length === 0}
              >
                <option value="">All Subjects</option>
                {filteredSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chapters Checkbox List */}
          <div className="shadow border rounded w-full py-2 px-3 bg-white max-h-48 overflow-y-auto">
            {filteredChapters.length === 0 ? (
              <p className="text-gray-500 text-sm py-2">No chapters available for the selected filters</p>
            ) : (
              filteredChapters.map((chapter) => {
                const isSelected = formValues.chapter_ids.includes(chapter.id!);
                const subject = subjects.find(s => s.id === chapter.subject_id);
                return (
                  <label 
                    key={chapter.id} 
                    className={`flex items-center py-2 px-2 hover:bg-gray-50 cursor-pointer rounded ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleChapterToggle(chapter.id!)}
                      className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <div className="flex flex-col">
                      <span className="text-gray-700">{chapter.name}</span>
                      <span className="text-gray-400 text-xs">{subject?.name || 'Unknown Subject'}</span>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate('/topics')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Topic'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TopicForm;
