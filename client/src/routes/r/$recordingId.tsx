import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRecordings } from '../../contexts/RecordingsContext';
import PlaybackSection from '../../components/PlaybackSection';

export const Route = createFileRoute('/r/$recordingId')({
  component: RecordingDetailPage,
});

function RecordingDetailPage() {
  const { recordingId } = Route.useParams();
  const navigate = useNavigate();
  const { recordings, setSelectedRecording } = useRecordings();

  useEffect(() => {
    const recording = recordings.find((r) => r.id === recordingId);
    if (recording) {
      setSelectedRecording(recording);
    }
  }, [recordingId, recordings, setSelectedRecording]);

  const recording = recordings.find((r) => r.id === recordingId);

  if (!recording) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] mb-4">Recording not found</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-full"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Mobile Back Button */}
      <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]">
        <button
          onClick={() => navigate({ to: '/' })}
          className="p-2 hover:bg-[var(--color-bg-hover)] rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} className="text-[var(--color-text-primary)]" />
        </button>
        <h2 className="text-lg font-medium text-[var(--color-text-primary)] truncate">
          {recording.title}
        </h2>
      </div>

      {/* Playback Section */}
      <div className="flex-1 overflow-auto">
        <PlaybackSection recording={recording} />
      </div>
    </div>
  );
}
