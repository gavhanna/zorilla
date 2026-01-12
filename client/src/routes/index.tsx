import { createFileRoute, Link } from '@tanstack/react-router';
import { Mic } from 'lucide-react';
import { useRecordings } from '../contexts/RecordingsContext';
import RecordingsList from '../components/RecordingsList';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { recordings } = useRecordings();

  return (
    <>
      {/* Mobile: Show List */}
      <div className="md:hidden h-full">
        <RecordingsList recordings={recordings} />
      </div>

      {/* Desktop: Show Empty State */}
      <div className="hidden md:flex h-full items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="text-center max-w-md px-6">
          <div className="w-24 h-24 mx-auto mb-6 bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center">
            <Mic size={40} className="text-[var(--color-text-secondary)]" />
          </div>
          <h2 className="text-2xl font-medium text-[var(--color-text-primary)] mb-3">
            Ready to Record
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Select a recording from the sidebar or start a new one
          </p>
          <Link
            to="/record"
            search={{ auto: false }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
          >
            <Mic size={20} />
            Start Recording
          </Link>
        </div>
      </div>
    </>
  );
}
