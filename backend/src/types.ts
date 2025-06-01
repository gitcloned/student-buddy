// Types
export interface Grade {
    id?: number;
    name: string;
}

export interface TeacherPersona {
    id?: number;
    grade_id: number;
    persona: string;
    language: 'hinglish' | 'english' | 'hindi';
    tone: 'candid' | 'formal';
    motivation: 'supportive' | 'disciplinary';
    humor: 'light' | 'none' | 'medium';
}

export interface Teacher {
    id?: number;
    name: string;
    persona_id: number;
    teaching_style: string;
}

export interface Subject {
    id?: number;
    name: string;
    grade_id: number;
    book_id?: number;
    default_teacher_id?: number;
}

export interface Child {
    id?: number;
    name: string;
    grade_id: number;
}

export interface Chapter {
    id?: number;
    name: string;
    subject_id: number;
}

export interface Topic {
    id?: number;
    name: string;
    chapter_id: number;
}

export interface TopicPrerequisite {
    topic_id: number;
    prerequisite_topic_id: number;
}

export interface LessonPlan {
    id?: number;
    child_id: number;
    topic_id: number;
    learning_objective: string;
}

export interface LessonSection {
    id?: number;
    lesson_plan_id: number;
    type: 'Introduction' |
    'I Do' |
    'We Do' |
    'You Do' |
    'Assessment' |
    'Homework';
    teaching_pedagogy: string;
}

export interface Resource {
    id?: number;
    type: 'Concept Video' | 'Question' | 'Quiz' | 'Practice Test';
    url: string;
    metadata?: string;
}

export interface SectionResource {
    section_id: number;
    resource_id: number;
}

export interface LearningLevel {
    id?: number;
    child_id: number;
    topic_id: number;
    level: 'Weak' | 'Average' | 'Strong';
    do_not_understand?: string;
    what_next?: string;
    last_evaluated_on: string;
}

export interface BookFeature {
    id: number;
    book_id: number;
    subject: string;
    name: string;
    how_to_teach: string;
}

export interface Book {
    id: number;
    features: BookFeature[];
}

export interface LearningIndicatorWithLevel {
    id: number;
    title: string;
    commonMisconception?: string;
    level: 'Weak' | 'Average' | 'Strong' | null;
    state: 'assess' | 'teach' | 'taught' | null;
    lastEvaluatedOn: string | null;
    doNotUnderstand: string | null;
    whatNext: string | null;
}

export interface TopicWithLearningIndicators {
    topicId: number;
    topicName: string;
    learningIndicators: LearningIndicatorWithLevel[];
}

export interface LearningProgression {
    chapterId: number;
    chapterName: string;
    subjectName: string;
    childId: number;
    childName: string;
    topics: TopicWithLearningIndicators[];
}