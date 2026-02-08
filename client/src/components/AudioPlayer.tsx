import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react';
import { formatDuration } from '../lib/utils';
import { useAudio } from '../hooks/useAudio';

interface AudioPlayerProps {
    audioUrl: string | null;
    onTimeUpdate?: (currentTime: number) => void;
    onDurationChange?: (duration: number) => void;
}

export default function AudioPlayer({
    audioUrl,
    onTimeUpdate,
    onDurationChange
}: AudioPlayerProps) {
    const { audioRef, isPlaying, currentTime, duration, togglePlay, skip, seek } = useAudio({
        audioUrl,
        onTimeUpdate,
        onDurationChange
    });

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        seek(time);
    };

    return (
        <div className="w-full">
            {audioUrl && (
                <audio ref={audioRef} src={audioUrl} preload="metadata" />
            )}

            {/* Progress Slider */}
            <div className="mb-4">
                <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-[var(--color-bg-tertiary)] rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[var(--color-accent)]
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-3
            [&::-moz-range-thumb]:h-3
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[var(--color-accent)]
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mt-1">
                    <span>{formatDuration(currentTime)}</span>
                    <span>-{formatDuration(duration - currentTime)}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
                {/* Rewind 15s */}
                <button
                    onClick={() => skip(-15)}
                    className="w-14 h-14 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)]
            flex items-center justify-center transition-colors"
                    aria-label="Rewind 15 seconds"
                >
                    <RotateCcw size={24} className="text-[var(--color-bg-primary)]" />
                </button>

                {/* Play/Pause */}
                <button
                    onClick={togglePlay}
                    className="w-20 h-14 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)]
            flex items-center justify-center transition-colors"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? (
                        <Pause size={28} className="text-[var(--color-bg-primary)]" fill="currentColor" />
                    ) : (
                        <Play size={28} className="text-[var(--color-bg-primary)]" fill="currentColor" />
                    )}
                </button>

                {/* Forward 15s */}
                <button
                    onClick={() => skip(15)}
                    className="w-14 h-14 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)]
            flex items-center justify-center transition-colors"
                    aria-label="Forward 15 seconds"
                >
                    <RotateCw size={24} className="text-[var(--color-bg-primary)]" />
                </button>
            </div>
        </div>
    );
}
