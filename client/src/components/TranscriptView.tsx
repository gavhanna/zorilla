import type { TranscriptSegment, StructuredTranscript } from '../types/types';
import { formatDuration } from '../lib/utils';
import { useEffect, useRef, useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';

interface TranscriptViewProps {
    transcript: StructuredTranscript | string | null;
    currentTime?: number;
    onSeek?: (time: number) => void;
    transcriptionModel?: string | null;
    onUpdate?: (newTranscript: StructuredTranscript) => Promise<void>;
}

export default function TranscriptView({
    transcript,
    currentTime = 0,
    onSeek,
    transcriptionModel,
    onUpdate
}: TranscriptViewProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeSegmentRef = useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableSegments, setEditableSegments] = useState<TranscriptSegment[]>([]);

    // Normalize segments
    const getSegments = (): TranscriptSegment[] => {
        if (!transcript) return [];
        if (typeof transcript === 'string') {
            return transcript.split('\n').filter(Boolean).map((text, i) => ({
                start: i * 5,
                end: (i + 1) * 5,
                text,
                confidence: 1
            }));
        }
        return transcript.segments;
    };

    // Auto-scroll to active segment
    useEffect(() => {
        if (!isEditing && activeSegmentRef.current && scrollContainerRef.current) {
            activeSegmentRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [currentTime, isEditing]);

    // Initialize editable segments when entering edit mode
    useEffect(() => {
        if (isEditing) {
            setEditableSegments(getSegments());
        }
    }, [isEditing, transcript]);

    const handleSave = async () => {
        if (!onUpdate) return;

        try {
            const fullText = editableSegments.map(s => s.text).join(' ');
            const newTranscript: StructuredTranscript = {
                fullText,
                segments: editableSegments
            };
            await onUpdate(newTranscript);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save transcript:', error);
            // Optionally add error state here
        }
    };

    const handleSegmentChange = (index: number, newText: string) => {
        setEditableSegments(prev => prev.map((seg, i) =>
            i === index ? { ...seg, text: newText } : seg
        ));
    };

    if (!transcript) {
        return (
            <div className="flex items-center justify-center h-64 text-[var(--color-text-secondary)]">
                No transcript available
            </div>
        );
    }

    const segments = isEditing ? editableSegments : getSegments();

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-secondary)] rounded-lg">
            {/* Header Actions */}
            <div className="flex items-center justify-end p-4 border-b border-[var(--color-border)]">
                {isEditing ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-full transition-colors"
                            aria-label="Cancel editing"
                        >
                            <X size={18} />
                        </button>
                        <button
                            onClick={handleSave}
                            className="p-2 text-[var(--color-accent)] hover:bg-[var(--color-bg-hover)] rounded-full transition-colors"
                            aria-label="Save changes"
                        >
                            <Save size={18} />
                        </button>
                    </div>
                ) : (
                    onUpdate && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-full transition-colors"
                            aria-label="Edit transcript"
                        >
                            <Edit2 size={16} />
                        </button>
                    )
                )}
            </div>

            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6"
            >
                <div className="space-y-6">
                    {segments.map((segment, index) => {
                        const isActive = !isEditing && currentTime >= segment.start && currentTime < segment.end;

                        return (
                            <div
                                key={index}
                                ref={isActive ? activeSegmentRef : null}
                                className={`
                                    transition-all duration-300 rounded-lg p-2 -ml-2
                                    ${isActive ? 'bg-[var(--color-accent)] bg-opacity-5' : ''}
                                    ${!isEditing && 'hover:bg-[var(--color-bg-hover)] cursor-pointer group'}
                                `}
                                onClick={() => !isEditing && onSeek?.(segment.start)}
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`
                                        text-[10px] font-mono
                                        ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]'}
                                    `}>
                                        {formatDuration(segment.start)}
                                    </span>
                                    {segment.confidence < 0.7 && !isEditing && (
                                        <span className="text-[10px] text-orange-400 opacity-60">
                                            Low confidence
                                        </span>
                                    )}
                                </div>

                                {isEditing ? (
                                    <textarea
                                        value={segment.text}
                                        onChange={(e) => handleSegmentChange(index, e.target.value)}
                                        className="w-full bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] p-2 rounded border border-[var(--color-border)] text-lg leading-relaxed focus:border-[var(--color-accent)] outline-none resize-none"
                                        rows={Math.max(2, Math.ceil(segment.text.length / 50))}
                                    />
                                ) : (
                                    <p className={`
                                        text-lg leading-relaxed transition-all duration-300
                                        ${isActive
                                            ? 'text-[var(--color-text-primary)] font-medium'
                                            : 'text-[var(--color-text-secondary)] opacity-70 group-hover:opacity-100'
                                        }
                                    `}>
                                        {segment.text}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {transcriptionModel && (
                    <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]">
                        Transcribed by {transcriptionModel}
                    </div>
                )}
            </div>
        </div>
    );
}

