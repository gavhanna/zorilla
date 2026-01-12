import { Outlet, createRootRoute } from '@tanstack/react-router'
import { AuthProvider } from '../contexts/AuthContext'
import { RecordingsProvider } from '../contexts/RecordingsContext'
import Header from '../components/Header'
import RecordingsList from '../components/RecordingsList'
import { useAuth } from '../contexts/AuthContext'
import { useRecordings } from '../contexts/RecordingsContext'
import { useEffect } from 'react'
import LoginPage from '../components/LoginPage'

function RootLayout() {
  const { isAuthenticated } = useAuth();
  const { loadRecordings, recordings, selectedRecording, loading, error } = useRecordings();

  useEffect(() => {
    if (isAuthenticated) {
      loadRecordings();
    }
  }, [isAuthenticated, loadRecordings]);

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

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar - Hidden on Mobile */}
        <div className="hidden md:block w-80 lg:w-96 border-r border-[var(--color-border)]">
          <RecordingsList recordings={recordings} selectedRecordingId={selectedRecording?.id} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <RecordingsProvider>
        <div className="h-screen w-screen overflow-hidden bg-[var(--color-bg-primary)]">
          <RootLayout />
        </div>
      </RecordingsProvider>
    </AuthProvider>
  ),
})
