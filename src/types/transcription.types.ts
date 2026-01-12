export interface TranscriptionConfig {
  modelName: string;
  modelPath?: string;
}

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

export interface TranscriptionResult {
  transcript: StructuredTranscript;
  language: string | undefined;
  duration: number | undefined;
}

export interface TranscriptionProgress {
  recordingId: string;
  progress: number; // 0-100
  status: 'pending' | 'recording' | 'done' | 'error';
  error?: string;
}

export type RecordingStatus = 'pending' | 'recording' | 'done' | 'error' | 'deleted';

export interface TranscriptionJob {
  recordingId: string;
  filePath: string;
  status: RecordingStatus;
  addedAt: Date;
}
