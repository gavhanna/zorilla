import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';

interface UseAudioOptions {
    audioUrl: string | null;
    onTimeUpdate?: (currentTime: number) => void;
    onDurationChange?: (duration: number) => void;
}

interface UseAudioReturn {
    audioRef: RefObject<HTMLAudioElement | null>;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    togglePlay: () => void;
    skip: (seconds: number) => void;
    seek: (time: number) => void;
}

export function useAudio({
    audioUrl: _audioUrl,
    onTimeUpdate,
    onDurationChange
}: UseAudioOptions): UseAudioReturn {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

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
            // Clean up: stop audio and remove event listeners
            audio.pause();
            audio.currentTime = 0;
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
            setIsPlaying(false);
        };
    }, [onTimeUpdate, onDurationChange]);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const skip = useCallback((seconds: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    }, [duration]);

    const seek = useCallback((time: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = time;
        setCurrentTime(time);
    }, []);

    return {
        audioRef,
        isPlaying,
        currentTime,
        duration,
        togglePlay,
        skip,
        seek
    };
}
