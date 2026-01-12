import { useState } from 'react';
import { Mic } from 'lucide-react';
import type { Recording } from '../types/types';
import { groupRecordingsByMonth } from '../lib/utils';
import SearchBar from './SearchBar';
import RecordingCard from './RecordingCard';

interface RecordingsListProps {
    recordings: Recording[];
    selectedRecordingId?: string | null;
    onSelectRecording: (recording: Recording) => void;
    onStartRecording?: () => void;
    recordingDurations?: Map<string, number>;
}

export default function RecordingsList({
    recordings,
    selectedRecordingId,
    onSelectRecording,
    onStartRecording,
    recordingDurations = new Map()
}: RecordingsListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter recordings based on search
    const filteredRecordings = recordings.filter(recording => {
        const query = searchQuery.toLowerCase();
        const titleMatch = recording.title.toLowerCase().includes(query);

        let transcriptMatch = false;
        if (recording.transcript) {
            if (typeof recording.transcript === 'string') {
                transcriptMatch = recording.transcript.toLowerCase().includes(query);
            } else if (typeof recording.transcript === 'object' && 'fullText' in recording.transcript) {
                transcriptMatch = recording.transcript.fullText.toLowerCase().includes(query);
            }
        }

        return titleMatch || transcriptMatch;
    });

    // Group by month
    const groupedRecordings = groupRecordingsByMonth(filteredRecordings);

    return (
        <div className="h-full flex flex-col bg-[var(--color-bg-primary)] relative">
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-border)]">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search your recordings"
                />
            </div>

            {/* Recordings List */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
                {Object.keys(groupedRecordings).length === 0 ? (
                    <div className="text-center text-[var(--color-text-secondary)] mt-8">
                        No recordings found
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedRecordings).map(([month, monthRecordings]) => (
                            <div key={month}>
                                <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 px-2">
                                    {month}
                                </h2>
                                <div className="space-y-2">
                                    {monthRecordings.map((recording) => (
                                        <RecordingCard
                                            key={recording.id}
                                            recording={recording}
                                            isActive={recording.id === selectedRecordingId}
                                            onClick={() => onSelectRecording(recording)}
                                            duration={recordingDurations.get(recording.id) || 0}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Record Button */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                <button
                    onClick={onStartRecording}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600
            flex items-center justify-center transition-all shadow-lg
            hover:scale-110 active:scale-95"
                    aria-label="Start new recording"
                >
                    <Mic size={28} className="text-white" />
                </button>
            </div>
        </div>
    );
}
