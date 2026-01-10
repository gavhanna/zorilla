import { useState, useRef } from 'react';
import { Star, Share2, MoreVertical, Mic } from 'lucide-react';
import type { Recording } from '../types/types';
import type WaveSurfer from 'wavesurfer.js';
import { formatRecordingTitle } from '../lib/utils';
import { getAudioUrl } from '../lib/api';
import WaveformVisualizer from './WaveformVisualizer';
import AudioPlayer from './AudioPlayer';
import TranscriptView from './TranscriptView';

interface PlaybackSectionProps {
    recording: Recording | null;
    onSeek?: (time: number) => void;
}

export default function PlaybackSection({ recording, onSeek }: PlaybackSectionProps) {
    const [activeTab, setActiveTab] = useState<'audio' | 'transcript'>('audio');
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const wavesurferRef = useRef<WaveSurfer | null>(null);

    if (!recording) {
        return (
            <div className="h-full flex items-center justify-center bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]">
                <div className="text-center">
                    <Mic size={64} className="mx-auto mb-4 opacity-20" />
                    <p>Select a recording to play</p>
                </div>
            </div>
        );
    }

    const audioUrl = getAudioUrl(recording.filePath);
    const title = recording.title || formatRecordingTitle(recording.createdAt);

    const handleSeek = (time: number) => {
        setCurrentTime(time);
        onSeek?.(time);
        // Note: WaveformVisualizer will handle the seeking via the currentTime prop update
    };

    const handleWaveSurferReady = (wavesurfer: WaveSurfer) => {
        wavesurferRef.current = wavesurfer;
        setDuration(wavesurfer.getDuration());

        // Listen to WaveSurfer interactions (clicking on the waveform)
        wavesurfer.on('interaction', (newTime) => {
            setCurrentTime(newTime);
        });
    };

    return (
        <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
            {/* Header */}
            <div className="p-6 border-b border-[var(--color-border)]">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-medium text-[var(--color-text-primary)] mb-1">
                            {title}
                        </h1>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            {new Date(recording.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className="p-2 hover:bg-[var(--color-bg-hover)] rounded-full transition-colors"
                            aria-label="Favorite"
                        >
                            <Star size={20} className="text-[var(--color-text-secondary)]" />
                        </button>
                        <button
                            className="p-2 hover:bg-[var(--color-bg-hover)] rounded-full transition-colors"
                            aria-label="Share"
                        >
                            <Share2 size={20} className="text-[var(--color-text-secondary)]" />
                        </button>
                        <button
                            className="p-2 hover:bg-[var(--color-bg-hover)] rounded-full transition-colors"
                            aria-label="More options"
                        >
                            <MoreVertical size={20} className="text-[var(--color-text-secondary)]" />
                        </button>
                    </div>
                </div>

                {/* Category Badge */}
                {recording.transcriptionModel && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-accent)] bg-opacity-20 
            rounded-full text-xs text-[var(--color-accent)]">
                        <Mic size={12} />
                        Speech
                    </div>
                )}
            </div>

            {/* Tab Selector */}
            <div className="px-6 pt-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('audio')}
                        className={`
              px-6 py-2 rounded-full text-sm font-medium transition-colors
              ${activeTab === 'audio'
                                ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                            }
            `}
                    >
                        <div className="flex items-center gap-2">
                            <Mic size={14} />
                            Audio
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('transcript')}
                        className={`
              px-6 py-2 rounded-full text-sm font-medium transition-colors
              ${activeTab === 'transcript'
                                ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                            }
            `}
                    >
                        Transcript
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'audio' ? (
                    <WaveformVisualizer
                        audioUrl={audioUrl}
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={handleSeek}
                        onReady={handleWaveSurferReady}
                    />
                ) : (
                    <TranscriptView
                        transcript={recording.transcript}
                        currentTime={currentTime}
                        onSeek={handleSeek}
                        transcriptionModel={recording.transcriptionModel}
                    />
                )}
            </div>

            {/* Audio Player Controls */}
            <div className="p-6 border-t border-[var(--color-border)]">
                <AudioPlayer
                    audioUrl={audioUrl}
                    onTimeUpdate={setCurrentTime}
                    onDurationChange={setDuration}
                />
            </div>
        </div>
    );
}
