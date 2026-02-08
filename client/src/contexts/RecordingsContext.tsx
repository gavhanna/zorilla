import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Recording } from '../types/types';
import { fetchRecordings, updateRecording as apiUpdateRecording } from '../lib/api';

interface RecordingsContextType {
    recordings: Recording[];
    selectedRecording: Recording | null;
    loading: boolean;
    error: string | null;
    loadRecordings: () => Promise<void>;
    saveRecording: (audioBlob: Blob) => Promise<void>;
    setSelectedRecording: (recording: Recording | null) => void;
    updateRecording: (id: string, data: Partial<Recording>) => Promise<void>;
}

const RecordingsContext = createContext<RecordingsContextType | undefined>(undefined);

export function RecordingsProvider({ children }: { children: ReactNode }) {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadRecordings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchRecordings();
            setRecordings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load recordings');
            console.error('Error loading recordings:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveRecording = useCallback(async (audioBlob: Blob) => {
        try {
            const formData = new FormData();
            const timestamp = new Date().toLocaleString('en-US', {
                day: 'numeric',
                month: 'short',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
            const title = `${timestamp}`;

            formData.append('file', audioBlob, 'recording.webm');
            formData.append('title', title);

            const token = localStorage.getItem('token');
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            const response = await fetch(`${API_BASE_URL}/api/recordings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to save recording');
            }

            await loadRecordings();
        } catch (error) {
            console.error('Error saving recording:', error);
            throw error;
        }
    }, [loadRecordings]);

    const updateRecording = useCallback(async (id: string, data: Partial<Recording>) => {
        try {
            await apiUpdateRecording(id, data);

            // Update local state
            setRecordings(prev => prev.map(rec =>
                rec.id === id ? { ...rec, ...data } : rec
            ));

            // Update selected recording if it's the one being updated
            if (selectedRecording?.id === id) {
                setSelectedRecording(prev => prev ? { ...prev, ...data } : null);
            }
        } catch (error) {
            console.error('Error updating recording:', error);
            throw error;
        }
    }, [selectedRecording]);

    return (
        <RecordingsContext.Provider
            value={{
                recordings,
                selectedRecording,
                loading,
                error,
                loadRecordings,
                saveRecording,
                setSelectedRecording,
                updateRecording,
            }}
        >
            {children}
        </RecordingsContext.Provider>
    );
}

export function useRecordings() {
    const context = useContext(RecordingsContext);
    if (context === undefined) {
        throw new Error('useRecordings must be used within a RecordingsProvider');
    }
    return context;
}
