import { getJobQueue } from './services/jobQueue.service';
import { getTranscriptionService } from './services/transcription.service';

/**
 * Background worker for processing transcription jobs
 * Polls the job queue and processes transcriptions one at a time
 */
class TranscriptionWorker {
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private pollInterval: number;
  private enabled: boolean;

  constructor(pollIntervalMs: number = 2000, enabled: boolean = true) {
    this.pollInterval = pollIntervalMs;
    this.enabled = enabled;
  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Worker is already running');
      return;
    }

    if (!this.enabled) {
      console.log('Transcription worker is disabled');
      return;
    }

    try {
      // Initialize transcription service
      const transcriptionService = getTranscriptionService();
      await transcriptionService.initialize();

      this.isRunning = true;
      console.log(`Transcription worker started (polling every ${this.pollInterval}ms)`);

      // Start polling loop
      this.interval = setInterval(() => {
        this.processNextJob().catch((error) => {
          console.error('Error processing job:', error);
        });
      }, this.pollInterval);
    } catch (error) {
      console.error('Failed to start transcription worker:', error);
      throw error;
    }
  }

  /**
   * Stop the worker
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isRunning = false;
    console.log('Transcription worker stopped');
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob(): Promise<void> {
    const jobQueue = getJobQueue();
    const transcriptionService = getTranscriptionService();

    // Get the next job
    const job = jobQueue.getNext();

    if (!job) {
      // No jobs to process
      return;
    }

    console.log(`Processing job: ${job.recordingId}`);

    try {
      // Transcribe the audio file
      await transcriptionService.transcribe(job.recordingId, job.filePath);

      console.log(`Successfully processed job: ${job.recordingId}`);
    } catch (error) {
      console.error(`Failed to process job ${job.recordingId}:`, error);
      // Error is already handled in transcription service (marks recording as error)
    } finally {
      // Mark job as complete
      jobQueue.complete(job.recordingId);
    }
  }

  /**
   * Check if the worker is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get worker statistics
   */
  getStats(): {
    running: boolean;
    queueSize: number;
    processingCount: number;
  } {
    const jobQueue = getJobQueue();
    const stats = jobQueue.getStats();

    return {
      running: this.isRunning,
      queueSize: stats.queued,
      processingCount: stats.processing,
    };
  }
}

// Singleton instance
let workerInstance: TranscriptionWorker | null = null;

/**
 * Get or create the transcription worker singleton
 */
export function getTranscriptionWorker(): TranscriptionWorker {
  if (!workerInstance) {
    const pollInterval = parseInt(process.env.TRANSCRIPTION_WORKER_INTERVAL_MS || '2000', 10);
    const enabled = process.env.TRANSCRIPTION_WORKER_ENABLED !== 'false';

    workerInstance = new TranscriptionWorker(pollInterval, enabled);
  }

  return workerInstance;
}

/**
 * Start the transcription worker
 */
export async function startTranscriptionWorker(): Promise<void> {
  const worker = getTranscriptionWorker();
  await worker.start();
}

/**
 * Stop the transcription worker
 */
export function stopTranscriptionWorker(): void {
  const worker = getTranscriptionWorker();
  worker.stop();
}

export { TranscriptionWorker };
