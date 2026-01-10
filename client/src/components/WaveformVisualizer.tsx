import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
    audioUrl: string | null;
    currentTime: number;
    duration: number;
    onSeek?: (time: number) => void;
}

export default function WaveformVisualizer({
    audioUrl,
    currentTime,
    duration,
    onSeek
}: WaveformVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Clear canvas
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Generate waveform (simplified - in production, analyze actual audio)
        const barCount = 100;
        const barWidth = rect.width / barCount;
        const centerY = rect.height / 2;

        for (let i = 0; i < barCount; i++) {
            // Generate pseudo-random heights for demo
            const height = Math.sin(i * 0.5) * 30 + Math.random() * 20 + 20;
            const x = i * barWidth;

            // Color based on playback position
            const progress = duration > 0 ? currentTime / duration : 0;
            const isPlayed = i / barCount < progress;

            ctx.fillStyle = isPlayed
                ? 'var(--color-accent)'
                : 'var(--color-text-tertiary)';

            ctx.fillRect(
                x + barWidth * 0.2,
                centerY - height / 2,
                barWidth * 0.6,
                height
            );
        }

        // Draw playback position indicator
        if (duration > 0) {
            const progress = currentTime / duration;
            const x = rect.width * progress;

            ctx.strokeStyle = 'var(--color-accent)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, rect.height);
            ctx.stroke();
        }
    }, [currentTime, duration, audioUrl]);

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onSeek || duration === 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = x / rect.width;
        const newTime = progress * duration;

        onSeek(newTime);
    };

    return (
        <div className="w-full h-64 flex items-center justify-center bg-[var(--color-bg-secondary)] rounded-lg p-8">
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                className="w-full h-full cursor-pointer"
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
}
