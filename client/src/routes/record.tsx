import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useRecordings } from '../contexts/RecordingsContext';
import RecordingInterface from '../components/RecordingInterface';

type RecordSearch = {
  auto?: boolean;
};

export const Route = createFileRoute('/record')({
  component: RecordPage,
  validateSearch: (search: Record<string, unknown>): RecordSearch => {
    return {
      auto: search.auto === true || search.auto === 'true',
    };
  },
});

function RecordPage() {
  const navigate = useNavigate();
  const { saveRecording } = useRecordings();
  const { auto } = Route.useSearch();
  const recordingInterfaceRef = useRef<{ startRecording: () => void } | null>(null);

  useEffect(() => {
    // Auto-start recording if the auto param is present
    if (auto && recordingInterfaceRef.current) {
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        recordingInterfaceRef.current?.startRecording();
      }, 100);
    }
  }, [auto]);

  const handleSave = async (audioBlob: Blob, duration: number) => {
    try {
      await saveRecording(audioBlob);
      navigate({ to: '/' });
    } catch (error) {
      console.error('Error saving recording:', error);
      alert('Failed to save recording. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate({ to: '/' });
  };

  return (
    <div className="h-full">
      <RecordingInterface
        onSave={handleSave}
        onCancel={handleCancel}
        autoStart={auto}
      />
    </div>
  );
}
