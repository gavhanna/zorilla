import type { Recording } from '../types/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
    return localStorage.getItem('token');
}

/**
 * Handle 401 errors by clearing token and reloading
 */
function handleAuthError() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

/**
 * Fetch all recordings for the current user
 */
export async function fetchRecordings(): Promise<Recording[]> {
    const token = getAuthToken();
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/recordings`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleAuthError();
            throw new Error('Not authenticated');
        }
        throw new Error(`Failed to fetch recordings: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch a single recording by ID
 */
export async function fetchRecordingById(id: string): Promise<Recording> {
    const token = getAuthToken();
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/recordings/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleAuthError();
            throw new Error('Not authenticated');
        }
        if (response.status === 404) {
            throw new Error('Recording not found');
        }
        throw new Error(`Failed to fetch recording: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Delete a recording
 */
export async function deleteRecording(id: string): Promise<Recording> {
    const token = getAuthToken();
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/recordings/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleAuthError();
            throw new Error('Not authenticated');
        }
        throw new Error(`Failed to delete recording: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get audio file URL for a recording
 */
export function getAudioUrl(filePath: string | null): string | null {
    if (!filePath) return null;
    return `${API_BASE_URL}/${filePath}`;
}

/**
 * Update a recording (title or transcript)
 */
export async function updateRecording(id: string, data: Partial<Recording>): Promise<Recording> {
    const token = getAuthToken();
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/recordings/${id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleAuthError();
            throw new Error('Not authenticated');
        }
        throw new Error(`Failed to update recording: ${response.statusText}`);
    }

    return response.json();
}
