import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Mic, User } from 'lucide-react';
import type { Recording } from '../types/types';
import { fetchRecordings } from '../lib/api';
import RecordingsList from '../components/RecordingsList';
import PlaybackSection from '../components/PlaybackSection';
import LoginPage from '../components/LoginPage';
import { useAuth } from '../contexts/AuthContext';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { isAuthenticated } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordingDurations] = useState(new Map<string, number>());

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const data = await fetchRecordings();
      setRecordings(data);

      // Auto-select first recording on desktop
      if (data.length > 0 && window.innerWidth >= 768) {
        setSelectedRecording(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recordings');
      console.error('Error loading recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecording = (recording: Recording) => {
    // On mobile, navigate to recording detail page
    if (window.innerWidth < 768) {
      window.location.href = `/${recording.id}`;
    } else {
      // On desktop, update selected recording
      setSelectedRecording(recording);
    }
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="animate-pulse text-[var(--color-text-secondary)]">
          Loading recordings...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadRecordings}
            className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-full"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
            <Mic size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-medium text-[var(--color-text-primary)]">Recorder</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                window.location.reload();
              }
            }}
            className="w-10 h-10 bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center hover:bg-[var(--color-bg-hover)] transition-colors"
            title="Logout"
          >
            <User size={20} className="text-[var(--color-text-secondary)]" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: Split View | Mobile: List Only */}
        <div className="w-full md:w-80 lg:w-96 border-r border-[var(--color-border)] md:block">
          <RecordingsList
            recordings={recordings}
            selectedRecordingId={selectedRecording?.id}
            onSelectRecording={handleSelectRecording}
            recordingDurations={recordingDurations}
          />
        </div>

        {/* Desktop: Playback Section | Mobile: Hidden */}
        <div className="hidden md:block flex-1">
          <PlaybackSection recording={selectedRecording} />
        </div>
      </div>
    </div>
  );
}
