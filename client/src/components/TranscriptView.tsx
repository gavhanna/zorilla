import { parseTranscript } from '../lib/utils';

interface TranscriptViewProps {
    transcript: string | null;
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
    const segments = parseTranscript(transcript);

    if (!transcript) {
        return (
            <div className="flex items-center justify-center h-64 text-[var(--color-text-secondary)]">
                No transcript available
            </div>
        );
    }

    return (
        <div className="bg-[var(--color-bg-secondary)] rounded-lg p-6 max-h-96 overflow-y-auto">
            <div className="space-y-4">
                {segments.map((segment, index) => {
                    const isActive = currentTime >= segment.timestamp &&
                        (index === segments.length - 1 || currentTime < segments[index + 1].timestamp);

                    return (
                        <div key={index} className="group">
                            <button
                                onClick={() => onSeek?.(segment.timestamp)}
                                className={`
                  text-xs font-medium mb-1 transition-colors
                  ${isActive
                                        ? 'text-[var(--color-accent)]'
                                        : 'text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)]'
                                    }
                `}
                            >
                                {Math.floor(segment.timestamp / 60).toString().padStart(2, '0')}:
                                {(segment.timestamp % 60).toString().padStart(2, '0')}
                            </button>
                            <p className={`
                text-base leading-relaxed transition-colors
                ${isActive
                                    ? 'text-[var(--color-text-primary)]'
                                    : 'text-[var(--color-text-secondary)]'
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
