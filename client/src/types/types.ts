// TypeScript types for the application

export interface Recording {
    id: string;
    title: string;
    transcript: string | null;
    filePath: string | null;
    userId: string;
    status: RecordingStatus;
    createdAt: string;
    updatedAt: string;
}

export type RecordingStatus = 'pending' | 'recording' | 'done' | 'error' | 'deleted';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    avatar: string | null;
    createdAt: string;
    updatedAt: string;
}
