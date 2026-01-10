import type { Recording, GroupedRecordings } from '../types/types';

/**
 * Format seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Format time for display (e.g., "2:56 p.m.")
 */
export function formatTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Format date and time for recording title
 */
export function formatRecordingTitle(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
    }) + ' at ' + formatTime(d);
}

/**
 * Group recordings by month
 */
export function groupRecordingsByMonth(recordings: Recording[]): GroupedRecordings {
    const grouped: GroupedRecordings = {};

    recordings.forEach((recording) => {
        const date = new Date(recording.createdAt);
        const now = new Date();
        const isCurrentYear = date.getFullYear() === now.getFullYear();

        let key: string;
        if (isCurrentYear) {
            key = date.toLocaleDateString('en-US', { month: 'long' });
        } else {
            key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }

        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(recording);
    });

    // Sort recordings within each group by date (newest first)
    Object.keys(grouped).forEach((key) => {
        grouped[key].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    });

    return grouped;
}

/**
 * Tailwind class name merger (simple version)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
}

/**
 * Calculate audio duration from file (placeholder - will need actual implementation)
 */
export function getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve) => {
        const audio = new Audio(filePath);
        audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration);
        });
        audio.addEventListener('error', () => {
            resolve(0);
        });
    });
}

/**
 * Parse transcript into segments with timestamps
 */
export function parseTranscript(transcript: string | null): { timestamp: number; text: string }[] {
    if (!transcript) return [];

    // Simple parser - assumes format like "00:05\nHello, how\n00:20\nBut, Can you..."
    const segments: { timestamp: number; text: string }[] = [];
    const lines = transcript.split('\n');

    let currentTimestamp = 0;
    let currentText = '';

    for (const line of lines) {
        // Check if line is a timestamp (MM:SS format)
        const timestampMatch = line.match(/^(\d{2}):(\d{2})$/);
        if (timestampMatch) {
            // Save previous segment if exists
            if (currentText.trim()) {
                segments.push({ timestamp: currentTimestamp, text: currentText.trim() });
            }
            // Parse new timestamp
            const minutes = parseInt(timestampMatch[1], 10);
            const seconds = parseInt(timestampMatch[2], 10);
            currentTimestamp = minutes * 60 + seconds;
            currentText = '';
        } else {
            // Accumulate text
            currentText += (currentText ? ' ' : '') + line;
        }
    }

    // Add final segment
    if (currentText.trim()) {
        segments.push({ timestamp: currentTimestamp, text: currentText.trim() });
    }

    return segments;
}
