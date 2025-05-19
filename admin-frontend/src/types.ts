// Types
export interface Grade {
    id?: number;
    name: string;
}

export interface TeacherPersona {
    id?: number;
    grade_id: number;
    name?: string; // Added for UI display
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
    title: string;
    topic_id: number;
    teacher_id: number;
    learning_level_id: number; // Direct level value (1-5), not a reference to a LearningLevel entity
    duration_minutes: number;
    objectives: string;
}

export interface LessonSection {
    id?: number;
    lesson_plan_id: number;
    title: string;
    content: string;
    duration_minutes: number;
    order_index?: number;
    type: 'Introduction' | 'I Do' | 'We Do' | 'You Do' | 'Assessment' | 'Homework';
    teaching_pedagogy?: string;
}

export interface Resource {
    id?: number;
    title: string;
    type: 'Concept Video' | 'Question' | 'Quiz' | 'Practice Test';
    url: string;
    description?: string;
}

export interface SectionResource {
    section_id: number;
    resource_id: number;
}

export interface LearningLevel {
    id?: number;
    child_id: number;
    topic_id: number;
    level: string; // Changed to number to match backend
    notes: string; // Added to match backend
    do_not_understand?: string;
    what_next?: string;
    last_evaluated_on?: string; // Made optional
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