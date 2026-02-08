import WaveSurfer from 'wavesurfer.js';
import { useWaveform } from '../hooks/useWaveform';

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
    const { containerRef, scrollContainerRef, waveformContainerRef } = useWaveform({
        audioUrl,
        currentTime,
        duration,
        onSeek,
        onReady
    });

    return (
        <div ref={waveformContainerRef} className="flex-1 flex flex-col bg-[var(--color-bg-secondary)] rounded-lg p-4">
            {/* Scrollable Waveform Container */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-x-auto overflow-y-hidden"
                style={{
                    scrollBehavior: 'smooth',
                }}
            >
                <div ref={containerRef} className="h-full" />
            </div>

            {!audioUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-secondary)]">
                    No audio available
                </div>
            )}
        </div>
    );
}
