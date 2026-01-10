import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react';
import { formatDuration } from '../lib/utils';

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
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1.0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            onTimeUpdate?.(audio.currentTime);
        };

        const handleDurationChange = () => {
            setDuration(audio.duration);
            onDurationChange?.(audio.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [onTimeUpdate, onDurationChange]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.playbackRate = playbackRate;
    }, [playbackRate]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const skip = (seconds: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;
        const time = parseFloat(e.target.value);
        audio.currentTime = time;
        setCurrentTime(time);
    };

    const cyclePlaybackRate = () => {
        const rates = [0.5, 1.0, 1.5, 2.0];
        const currentIndex = rates.indexOf(playbackRate);
        const nextIndex = (currentIndex + 1) % rates.length;
        setPlaybackRate(rates[nextIndex]);
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

                {/* Playback Speed */}
                <button
                    onClick={cyclePlaybackRate}
                    className="ml-4 px-4 py-2 rounded-full border border-[var(--color-text-secondary)] 
            text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] 
            hover:text-[var(--color-accent)] transition-colors text-sm font-medium"
                >
                    {playbackRate}×
                </button>
            </div>
        </div>
    );
}
