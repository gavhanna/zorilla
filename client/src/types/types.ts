// TypeScript types for the application

export interface TranscriptSegment {
    start: number;
    end: number;
    text: string;
    confidence: number;
}

export interface StructuredTranscript {
    fullText: string;
    segments: TranscriptSegment[];
}

export interface Recording {
    id: string;
    title: string;
    transcript: StructuredTranscript | string | null;
    filePath: string | null;
    geolocation: {
        latitude: number;
        longitude: number;
    } | null;
    userId: string;
    status: RecordingStatus;
    transcriptProgress: number;
    errorMessage: string | null;
    transcriptionModel: string | null;
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

export interface GroupedRecordings {
    [key: string]: Recording[];
}
