import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Pause, Play } from 'lucide-react';
import { formatDuration } from '../lib/utils';

interface RecordingInterfaceProps {
    onSave?: (audioBlob: Blob, duration: number) => void;
    onCancel?: () => void;
    autoStart?: boolean;
}

export default function RecordingInterface({ onSave, onCancel, autoStart = false }: RecordingInterfaceProps) {
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
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
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

    const startRecording = async () => {
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
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            pausedTimeRef.current = Date.now() - startTimeRef.current + pausedTimeRef.current;
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);

            startTimeRef.current = Date.now();
            timerRef.current = window.setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current + pausedTimeRef.current) / 1000));
            }, 100);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const handleSave = async () => {
        if (chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            onSave?.(blob, duration);
        }
    };

    const handleCancel = () => {
        if (isRecording) {
            stopRecording();
        }
        onCancel?.();
    };

    return (
        <div className="h-full flex flex-col items-center justify-center bg-[var(--color-bg-primary)] p-8">
            <div className="max-w-md w-full text-center">
                {/* Recording Indicator */}
                <div className="mb-8">
                    <div className={`
            w-32 h-32 mx-auto rounded-full flex items-center justify-center
            ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-red-500'}
          `}>
                        <Mic size={64} className="text-white" />
                    </div>
                </div>

                {/* Duration Display */}
                <div className="text-6xl font-light text-[var(--color-text-primary)] mb-8 font-mono">
                    {formatDuration(duration)}
                </div>

                {/* Status Text */}
                <p className="text-[var(--color-text-secondary)] mb-8">
                    {!isRecording && !audioUrl && 'Ready to record'}
                    {isRecording && !isPaused && 'Recording...'}
                    {isPaused && 'Paused'}
                    {audioUrl && 'Recording complete'}
                </p>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    {!isRecording && !audioUrl && (
                        <button
                            onClick={startRecording}
                            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 
                flex items-center justify-center transition-colors shadow-lg"
                            aria-label="Start recording"
                        >
                            <Mic size={32} className="text-white" />
                        </button>
                    )}

                    {isRecording && !isPaused && (
                        <>
                            <button
                                onClick={pauseRecording}
                                className="w-16 h-16 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] 
                  flex items-center justify-center transition-colors"
                                aria-label="Pause recording"
                            >
                                <Pause size={24} className="text-[var(--color-bg-primary)]" />
                            </button>
                            <button
                                onClick={stopRecording}
                                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 
                  flex items-center justify-center transition-colors shadow-lg"
                                aria-label="Stop recording"
                            >
                                <Square size={32} className="text-white" fill="white" />
                            </button>
                        </>
                    )}

                    {isPaused && (
                        <>
                            <button
                                onClick={resumeRecording}
                                className="w-16 h-16 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] 
                  flex items-center justify-center transition-colors"
                                aria-label="Resume recording"
                            >
                                <Play size={24} className="text-[var(--color-bg-primary)]" />
                            </button>
                            <button
                                onClick={stopRecording}
                                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 
                  flex items-center justify-center transition-colors shadow-lg"
                                aria-label="Stop recording"
                            >
                                <Square size={32} className="text-white" fill="white" />
                            </button>
                        </>
                    )}
                </div>

                {/* Save/Cancel Buttons */}
                {audioUrl && (
                    <div className="flex gap-4">
                        <button
                            onClick={handleCancel}
                            className="flex-1 py-3 px-6 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]
                rounded-full hover:bg-[var(--color-bg-hover)] transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 py-3 px-6 bg-[var(--color-accent)] text-[var(--color-bg-primary)]
                rounded-full hover:bg-[var(--color-accent-dark)] transition-colors font-medium"
                        >
                            Save Recording
                        </button>
                    </div>
                )}

                {isRecording && (
                    <button
                        onClick={handleCancel}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
