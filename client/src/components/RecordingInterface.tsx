import { Mic, Square, Pause, Play } from 'lucide-react';
import { formatDuration } from '../lib/utils';
import { useRecording } from '../hooks/useRecording';

interface RecordingInterfaceProps {
    onSave?: (audioBlob: Blob, duration: number) => void;
    onCancel?: () => void;
    autoStart?: boolean;
}

export default function RecordingInterface({ onSave, onCancel, autoStart = false }: RecordingInterfaceProps) {
    const {
        isRecording,
        isPaused,
        duration,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        handleSave,
        handleCancel
    } = useRecording({ onSave, onCancel, autoStart });

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
                    {!isRecording && 'Ready to record'}
                    {isRecording && !isPaused && 'Recording...'}
                    {isPaused && 'Paused'}
                </p>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    {!isRecording && (
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
                {!isRecording && duration > 0 && (
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
