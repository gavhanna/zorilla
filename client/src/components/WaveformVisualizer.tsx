import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { ZoomIn, ZoomOut } from 'lucide-react';

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
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [zoom, setZoom] = useState(1); // 1x, 2x, 4x zoom levels
    const [isPlaying, setIsPlaying] = useState(false);

    // Pixels per second at 1x zoom
    const basePixelsPerSecond = 50;

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
            minPxPerSec: basePixelsPerSecond * zoom,
            scrollParent: true,
            autoCenter: false,
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

        // Track play/pause state
        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('pause', () => setIsPlaying(false));

        wavesurferRef.current = wavesurfer;

        return () => {
            wavesurfer.destroy();
        };
    }, [audioUrl, zoom, onSeek, onReady]);

    // Sync external time updates to waveform
    useEffect(() => {
        if (wavesurferRef.current && duration > 0) {
            const currentWaveTime = wavesurferRef.current.getCurrentTime();
            // Only seek if the difference is significant (> 100ms) to avoid infinite loops
            if (Math.abs(currentWaveTime - currentTime) > 0.1) {
                const progress = currentTime / duration;
                if (!wavesurferRef.current.isPlaying()) {
                    wavesurferRef.current.seekTo(progress);
                }
            }
        }
    }, [currentTime, duration]);

    // Auto-scroll to keep playhead centered during playback
    useEffect(() => {
        if (!scrollContainerRef.current || !containerRef.current || !isPlaying) return;

        const scrollContainer = scrollContainerRef.current;
        const waveformWidth = containerRef.current.offsetWidth;
        const containerWidth = scrollContainer.offsetWidth;
        const progress = currentTime / duration;
        const playheadPosition = waveformWidth * progress;

        // Center the playhead
        const targetScroll = playheadPosition - containerWidth / 2;
        scrollContainer.scrollLeft = Math.max(0, targetScroll);
    }, [currentTime, duration, isPlaying]);

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev * 2, 8)); // Max 8x zoom
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev / 2, 0.5)); // Min 0.5x zoom
    };

    return (
        <div className="w-full bg-[var(--color-bg-secondary)] rounded-lg p-4">
            {/* Zoom Controls */}
            <div className="flex justify-end gap-2 mb-4">
                <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="p-2 rounded-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] 
                        disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Zoom out"
                >
                    <ZoomOut size={20} className="text-[var(--color-text-primary)]" />
                </button>
                <div className="px-3 py-2 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm font-medium min-w-[60px] text-center">
                    {zoom}x
                </div>
                <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 8}
                    className="p-2 rounded-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] 
                        disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Zoom in"
                >
                    <ZoomIn size={20} className="text-[var(--color-text-primary)]" />
                </button>
            </div>

            {/* Scrollable Waveform Container */}
            <div
                ref={scrollContainerRef}
                className="w-full overflow-x-auto overflow-y-hidden"
                style={{
                    scrollBehavior: 'smooth',
                }}
            >
                <div ref={containerRef} className="min-w-full" />
            </div>

            {!audioUrl && (
                <div className="text-center text-[var(--color-text-secondary)] py-16">
                    No audio available
                </div>
            )}
        </div>
    );
}
