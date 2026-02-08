import { formatDuration } from '../lib/utils';
import { useEffect, useRef } from 'react';

interface TranscriptViewProps {
    transcript: string | null;
    currentTime?: number;
    onSeek?: (time: number) => void;
}

export default function TranscriptView({
    transcript,
    currentTime = 0,
    onSeek
}: TranscriptViewProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeSegmentRef = useRef<HTMLDivElement>(null);

    // Split transcript into segments for display
    const segments = transcript
        ? transcript.split('\n').filter(Boolean).map((text, i) => ({
            start: i * 5,
            end: (i + 1) * 5,
            text
        }))
        : [];

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

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-secondary)] rounded-lg">
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6"
            >
                <div className="space-y-6">
                    {segments.map((segment, index) => {
                        const isActive = currentTime >= segment.start && currentTime < segment.end;

                        return (
                            <div
                                key={index}
                                ref={isActive ? activeSegmentRef : null}
                                className={`
                                    transition-all duration-300 rounded-lg p-2 -ml-2
                                    ${isActive ? 'bg-[var(--color-accent)] bg-opacity-5' : ''}
                                    hover:bg-[var(--color-bg-hover)] cursor-pointer group
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
            </div>
        </div>
    );
}
