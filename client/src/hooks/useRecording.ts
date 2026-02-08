import { useState, useRef, useEffect, useCallback } from 'react';

interface UseRecordingOptions {
    onSave?: (audioBlob: Blob, duration: number) => void;
    onCancel?: () => void;
    autoStart?: boolean;
}

interface UseRecordingReturn {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    audioUrl: string | null;
    startRecording: () => Promise<void>;
    pauseRecording: () => void;
    resumeRecording: () => void;
    stopRecording: () => void;
    handleSave: () => Promise<void>;
    handleCancel: () => void;
}

export function useRecording({
    onSave,
    onCancel,
    autoStart = false
}: UseRecordingOptions = {}): UseRecordingReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const pausedTimeRef = useRef<number>(0);

    useEffect(() => {
        return () => {
            // Clean up timer
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            // Clean up audio URL
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            // Clean up MediaRecorder and media stream if still recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
                // Stop all media tracks to release the microphone
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [audioUrl]);

    // Auto-start recording if autoStart prop is true
    useEffect(() => {
        if (autoStart && !isRecording && !audioUrl) {
            startRecording();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoStart]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setIsPaused(false);

            // Start timer
            startTimeRef.current = Date.now();
            timerRef.current = window.setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current + pausedTimeRef.current) / 1000));
            }, 100);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please grant permission.');
        }
    }, []);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            pausedTimeRef.current = Date.now() - startTimeRef.current + pausedTimeRef.current;
        }
    }, []);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);

            startTimeRef.current = Date.now();
            timerRef.current = window.setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current + pausedTimeRef.current) / 1000));
            }, 100);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    }, []);

    const handleSave = useCallback(async () => {
        if (chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            onSave?.(blob, duration);
        }
    }, [onSave, duration]);

    const handleCancel = useCallback(() => {
        if (isRecording) {
            stopRecording();
        }
        onCancel?.();
    }, [isRecording, stopRecording, onCancel]);

    return {
        isRecording,
        isPaused,
        duration,
        audioUrl,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        handleSave,
        handleCancel
    };
}
