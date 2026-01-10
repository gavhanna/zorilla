import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformVisualizerProps {
    audioUrl: string | null;
    currentTime: number;
    duration: number;
    onSeek?: (time: number) => void;
    onReady?: (wavesurfer: WaveSurfer) => void;
}

export default function WaveformVisualizer({
    audioUrl,
    currentTime,
    duration,
    onSeek,
    onReady
}: WaveformVisualizerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);

    useEffect(() => {
        if (!containerRef.current || !audioUrl) return;

        // Create WaveSurfer instance
        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#5f6368',
            progressColor: '#a8c7fa',
            cursorColor: '#a8c7fa',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 200,
            normalize: true,
            backend: 'WebAudio',
            interact: true,
        });

        // Load audio
        wavesurfer.load(audioUrl);

        // Handle ready event
        wavesurfer.on('ready', () => {
            onReady?.(wavesurfer);
        });

        // Handle seek event
        wavesurfer.on('seeking', (seekTime) => {
            onSeek?.(seekTime);
        });

        wavesurferRef.current = wavesurfer;

        return () => {
            wavesurfer.destroy();
        };
    }, [audioUrl, onSeek, onReady]);

    // Sync external time updates to waveform
    useEffect(() => {
        if (wavesurferRef.current && duration > 0) {
            const currentWaveTime = wavesurferRef.current.getCurrentTime();
            // Only seek if the difference is significant (> 100ms) to avoid infinite loops
            // caused by rounding errors or the seek event updating the time
            if (Math.abs(currentWaveTime - currentTime) > 0.1) {
                const progress = currentTime / duration;
                if (!wavesurferRef.current.isPlaying()) {
                    wavesurferRef.current.seekTo(progress);
                }
            }
        }
    }, [currentTime, duration]);

    return (
        <div className="w-full bg-[var(--color-bg-secondary)] rounded-lg p-8">
            <div ref={containerRef} className="w-full" />
            {!audioUrl && (
                <div className="text-center text-[var(--color-text-secondary)] py-16">
                    No audio available
                </div>
            )}
        </div>
    );
}
