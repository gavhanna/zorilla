import type { TranscriptionJob } from '../types/transcription.types';

/**
 * Simple in-memory job queue for MVP
 * For production, consider upgrading to BullMQ with Redis
 */
class JobQueueService {
  private queue: TranscriptionJob[] = [];
  private processing = new Set<string>();
  // Track all known jobs to prevent race conditions
  private allJobs = new Map<string, TranscriptionJob>();

  /**
   * Add a job to the queue
   * Uses Map to ensure atomic check-and-add operation
   */
  add(job: TranscriptionJob): void {
    // Atomic check-and-add using Map
    if (!this.allJobs.has(job.recordingId)) {
      this.allJobs.set(job.recordingId, job);
      this.queue.push(job);
      console.log(`Job added to queue: ${job.recordingId}. Queue size: ${this.queue.length}`);
    } else {
      console.log(`Job already exists: ${job.recordingId}. Skipping.`);
    }
  }

  /**
   * Get the next job from the queue
   */
  getNext(): TranscriptionJob | null {
    if (this.queue.length === 0) {
      return null;
    }

    const job = this.queue.shift()!;
    this.processing.add(job.recordingId);
    // Keep job in allJobs, just update its tracking state

    console.log(
      `Job dequeued: ${job.recordingId}. Processing: ${this.processing.size}, Queue: ${this.queue.length}`
    );

    return job;
  }

  /**
   * Mark a job as complete (remove from processing set and allJobs)
   */
  complete(recordingId: string): void {
    this.processing.delete(recordingId);
    this.allJobs.delete(recordingId);
    console.log(
      `Job completed: ${recordingId}. Processing: ${this.processing.size}, Queue: ${this.queue.length}`
    );
  }

  /**
   * Get current queue size
   */
  getSize(): number {
    return this.queue.length;
  }

  /**
   * Get number of jobs currently being processed
   */
  getProcessingCount(): number {
    return this.processing.size;
  }

  /**
   * Check if there are any jobs to process
   */
  hasJobs(): boolean {
    return this.queue.length > 0;
  }

  /**
   * Get queue statistics
   */
  getStats(): { queued: number; processing: number } {
    return {
      queued: this.queue.length,
      processing: this.processing.size,
    };
  }

  /**
   * Clear all jobs (useful for testing)
   */
  clear(): void {
    this.queue = [];
    this.processing.clear();
    this.allJobs.clear();
  }

  /**
   * Remove a specific job from the queue
   */
  remove(recordingId: string): boolean {
    const index = this.queue.findIndex((j) => j.recordingId === recordingId);

    if (index !== -1) {
      this.queue.splice(index, 1);
      this.allJobs.delete(recordingId);
      console.log(`Job removed from queue: ${recordingId}`);
      return true;
    }

    return false;
  }
}

// Singleton instance
let jobQueueInstance: JobQueueService | null = null;

/**
 * Get or create the job queue singleton
 */
export function getJobQueue(): JobQueueService {
  if (!jobQueueInstance) {
    jobQueueInstance = new JobQueueService();
  }

  return jobQueueInstance;
}

export { JobQueueService };
