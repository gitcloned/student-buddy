// Types
export interface TeacherPersona {
    id?: number;
    grade: string;
    persona: string;
    language: 'hinglish' | 'english' | 'hindi';
    tone: 'candid' | 'formal';
    motivation: 'supportive' | 'disciplinary';
    humor: 'light' | 'none' | 'medium';
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