import type { TranscriptSegment, StructuredTranscript } from '../types/types';
import { formatDuration } from '../lib/utils';
import { useEffect, useRef } from 'react';

interface TranscriptViewProps {
    transcript: StructuredTranscript | string | null;
    currentTime?: number;
    onSeek?: (time: number) => void;
    transcriptionModel?: string | null;
}

export default function TranscriptView({
    transcript,
    currentTime = 0,
    onSeek,
    transcriptionModel
}: TranscriptViewProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeSegmentRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active segment
    useEffect(() => {
        if (activeSegmentRef.current && scrollContainerRef.current) {
            activeSegmentRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [currentTime]);

    if (!transcript) {
        return (
            <div className="flex items-center justify-center h-64 text-[var(--color-text-secondary)]">
                No transcript available
            </div>
        );
    }

    // Normalized segments for rendering
    let segments: TranscriptSegment[] = [];
    if (typeof transcript === 'string') {
        // Fallback for old string-based transcripts
        // Note: we can't easily get end times or confidence from old data
        const oldSegments = transcript.split('\n').filter(Boolean);
        segments = oldSegments.map((text, i) => ({
            start: i * 5, // Just a guess for old data
            end: (i + 1) * 5,
            text,
            confidence: 1
        }));
    } else {
        segments = transcript.segments;
    }

    return (
        <div
            ref={scrollContainerRef}
            className="bg-[var(--color-bg-secondary)] rounded-lg p-6 h-full overflow-y-auto"
        >
            <div className="space-y-6">
                {segments.map((segment, index) => {
                    const isActive = currentTime >= segment.start && currentTime < segment.end;

                    return (
                        <div
                            key={index}
                            ref={isActive ? activeSegmentRef : null}
                            className={`
                                group cursor-pointer transition-all duration-300 rounded-lg p-2 -ml-2
                                ${isActive ? 'bg-[var(--color-accent)] bg-opacity-5' : 'hover:bg-[var(--color-bg-hover)]'}
                            `}
                            onClick={() => onSeek?.(segment.start)}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`
                                    text-[10px] font-mono
                                    ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]'}
                                `}>
                                    {formatDuration(segment.start)}
                                </span>
                                {segment.confidence < 0.7 && (
                                    <span className="text-[10px] text-orange-400 opacity-60">
                                        Low confidence
                                    </span>
                                )}
                            </div>
                            <p className={`
                                text-lg leading-relaxed transition-all duration-300
                                ${isActive
                                    ? 'text-[var(--color-text-primary)] font-medium'
                                    : 'text-[var(--color-text-secondary)] opacity-70 group-hover:opacity-100'
                                }
                            `}>
                                {segment.text}
                            </p>
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
    );
}
