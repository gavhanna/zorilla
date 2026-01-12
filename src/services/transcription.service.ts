import { db } from '../db';
import { recordings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type { TranscriptionConfig, TranscriptionResult, StructuredTranscript } from '../types/transcription.types';

export class TranscriptionService {
  private config: TranscriptionConfig;
  private useDocker: boolean;
  private dockerContainerName: string;
  private pythonPath: string;
  private static readonly DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  constructor(config: TranscriptionConfig) {
    this.config = config;

    // Check if we should use Docker (env var overrides)
    this.useDocker = process.env.USE_DOCKER_FOR_TRANSCRIPTION === 'true' ||
      process.env.TRANSCRIPTION_USE_DOCKER === 'true';
    this.dockerContainerName = process.env.DOCKER_TRANSCRIPTION_CONTAINER || 'zorilla-transcription';

    // Allow custom Python path via env var, default to 'python3'
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
  }

  /**
   * Initialize the transcription service
   * Checks if Docker or Python/faster-whisper are available
   */
  async initialize(): Promise<void> {
    if (this.useDocker) {
      try {
        // Check if Docker is available
        await this.runCommand('docker', ['--version']);

        // Check if container is running
        await this.runCommand('docker', ['inspect', '--type=container', this.dockerContainerName]);

        console.log(`✓ Transcription service initialized (using Docker container: ${this.dockerContainerName})`);
      } catch (error) {
        throw new Error(
          `Docker transcription not available: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
          `Start the container with: docker compose -f docker compose.transcription.yml up -d`
        );
      }
    } else {
      try {
        // Check if Python is available
        await this.runCommand(this.pythonPath, ['--version']);

        // Check if faster-whisper is installed
        await this.runCommand(this.pythonPath, ['-c', 'import faster_whisper']);

        console.log('✓ Transcription service initialized (using local Python)');
      } catch (error) {
        throw new Error(
          `Local Python transcription not available: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
          `Install faster-whisper: pip install faster-whisper\n` +
          `Or use Docker: set USE_DOCKER_FOR_TRANSCRIPTION=true`
        );
      }
    }
  }

  /**
   * Transcribe an audio file using faster-whisper
   * @param recordingId - The recording ID to update
   * @param filePath - Path to the audio file
   * @returns The transcription result
   */
  async transcribe(recordingId: string, filePath: string): Promise<TranscriptionResult> {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }

    try {
      console.log(`Starting transcription for recording ${recordingId}`);

      // Update status to "recording"
      await this.updateStatus(recordingId, 'recording');

      let result: {
        success: boolean;
        transcript?: string;
        segments?: any[];
        error?: string;
        language?: string;
        duration?: number
      };

      if (this.useDocker) {
        result = await this.transcribeWithDocker(filePath);
      } else {
        result = await this.transcribeWithPython(filePath);
      }

      if (!result.success) {
        throw new Error(result.error || 'Transcription failed');
      }

      if (!result.transcript || !result.segments) {
        throw new Error('Transcription succeeded but missing transcript or segments');
      }

      console.log(`Transcription completed for recording ${recordingId}`);

      const structuredTranscript: StructuredTranscript = {
        fullText: result.transcript,
        segments: result.segments.map(s => ({
          start: s.start,
          end: s.end,
          text: s.text,
          confidence: s.confidence
        }))
      };

      // Update database with transcript and mark as done
      await db
        .update(recordings)
        .set({
          transcript: structuredTranscript,
          status: 'done',
          transcriptProgress: 100,
          transcriptionModel: this.config.modelName,
          updatedAt: new Date(),
        })
        .where(eq(recordings.id, recordingId));

      return {
        transcript: structuredTranscript,
        language: result.language,
        duration: result.duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`Transcription failed for recording ${recordingId}:`, error);

      // Mark recording as error
      await db
        .update(recordings)
        .set({
          status: 'error',
          errorMessage: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(recordings.id, recordingId));

      throw error;
    }
  }

  /**
   * Transcribe using Docker container
   */
  private async transcribeWithDocker(
    filePath: string
  ): Promise<{ success: boolean; transcript?: string; segments?: any[]; error?: string; language?: string; duration?: number }> {
    // Get path relative to project root for Docker mount
    // Volume is ./data:/audio, so we need to map projectRoot/data to /audio
    const absolutePath = path.resolve(filePath);
    const projectRoot = process.cwd();
    const dataPath = path.join(projectRoot, 'data');

    if (!absolutePath.startsWith(dataPath)) {
      throw new Error(`File is not in the data directory: ${absolutePath}`);
    }

    // Replace projectRoot/data with /audio for container path
    const containerPath = absolutePath.replace(dataPath, '/audio');

    // Build docker exec command
    const args = [
      'exec',
      this.dockerContainerName,
      'python3',
      '/app/transcribe.py',
      containerPath,
      '--model', this.config.modelName,
      '--language', 'auto',
    ];

    console.log(`Running: docker ${args.join(' ')}`);

    return this.runTranscriptionScript('docker', args);
  }

  /**
   * Transcribe using local Python
   */
  private async transcribeWithPython(
    filePath: string
  ): Promise<{ success: boolean; transcript?: string; segments?: any[]; error?: string; language?: string; duration?: number }> {
    // Get path to transcribe.py script
    const scriptPath = path.join(process.cwd(), 'transcribe.py');

    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Transcription script not found: ${scriptPath}`);
    }

    // Build command arguments
    const args = [
      scriptPath,
      filePath,
      '--model', this.config.modelName,
      '--language', 'auto',
    ];

    console.log(`Running: ${this.pythonPath} ${args.join(' ')}`);

    return this.runTranscriptionScript(this.pythonPath, args);
  }

  /**
   * Run the transcription script and parse JSON output
   */
  private runTranscriptionScript(
    command: string,
    args: string[]
  ): Promise<{ success: boolean; transcript?: string; segments?: any[]; error?: string; language?: string; duration?: number }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args);
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Set timeout for the transcription process
      const timeoutMs = parseInt(process.env.TRANSCRIPTION_TIMEOUT_MS || '', 10) || TranscriptionService.DEFAULT_TIMEOUT_MS;
      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
        reject(new Error(`Transcription timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        // Log stderr for debugging (faster-whisper uses stderr for progress)
        process.stderr.write(data);
      });

      child.on('close', (code) => {
        clearTimeout(timeout);

        if (timedOut) {
          return; // Already rejected by timeout handler
        }

        try {
          // Parse JSON output from the last line
          const trimmed = stdout.trim();
          if (!trimmed) {
            reject(new Error('No output from transcription script'));
            return;
          }
          const lines = trimmed.split('\n');
          const lastLine = lines[lines.length - 1];
          if (!lastLine) {
            reject(new Error('Empty output from transcription script'));
            return;
          }
          const result = JSON.parse(lastLine);

          if (result.success) {
            resolve(result);
          } else {
            const errorMsg = result.error ? String(result.error) : 'Transcription failed';
            reject(new Error(errorMsg));
          }
        } catch (error) {
          reject(new Error(`Failed to parse transcription output: ${stdout}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to spawn transcription process: ${error.message}`));
      });
    });
  }

  /**
   * Run a simple command and check if it succeeds
   */
  private runCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'pipe' });
      let stderr = '';
      let timedOut = false;

      // Commands should complete quickly - 10 second timeout
      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
        reject(new Error(`Command timed out: ${command} ${args.join(' ')}`));
      }, 10000);

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timeout);

        if (timedOut) {
          return; // Already rejected by timeout handler
        }

        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Update the status of a recording
   */
  private async updateStatus(recordingId: string, status: 'recording' | 'done' | 'error'): Promise<void> {
    await db
      .update(recordings)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(recordings.id, recordingId));
  }

  /**
   * Check if the service is ready
   */
  isReady(): boolean {
    return true;
  }
}

// Singleton instance
let transcriptionServiceInstance: TranscriptionService | null = null;

/**
 * Get or create the transcription service singleton
 */
export function getTranscriptionService(): TranscriptionService {
  if (!transcriptionServiceInstance) {
    const modelName = process.env.WHISPER_MODEL_NAME || 'base';
    const modelPath = process.env.WHISPER_MODEL_PATH;

    const config: TranscriptionConfig = {
      modelName,
    };

    if (modelPath) {
      config.modelPath = modelPath;
    }

    transcriptionServiceInstance = new TranscriptionService(config);
  }

  return transcriptionServiceInstance;
}
