import type { Recording } from '../types/types';
import { formatDate, formatTime, formatDuration } from '../lib/utils';

interface RecordingCardProps {
    recording: Recording;
    isActive?: boolean;
    onClick?: () => void;
    duration?: number;
}

export default function RecordingCard({
    recording,
    isActive = false,
    onClick,
    duration = 0
}: RecordingCardProps) {
    const date = new Date(recording.createdAt);
    const formattedDate = formatDate(date);
    const formattedTime = formatTime(date);
    const formattedDuration = formatDuration(duration);

    return (
        <div
            onClick={onClick}
            className={`
        p-4 rounded-lg cursor-pointer transition-all duration-200
        ${isActive
                    ? 'bg-[var(--color-bg-tertiary)]'
                    : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)]'
                }
      `}
        >
            <h3 className="text-[var(--color-text-primary)] font-medium mb-1 text-base">
                {recording.title}
            </h3>

            <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)] mb-2">
                <span>{formattedDate} • {formattedTime}</span>
                <span>{formattedDuration}</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-0.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                <div
                    className="h-full bg-[var(--color-progress)] transition-all duration-300"
                    style={{ width: `${recording.transcriptProgress || 0}%` }}
                />
            </div>
        </div>
    );
}
