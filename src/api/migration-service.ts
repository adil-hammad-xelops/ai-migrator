/**
 * Migration service (T043): Single-worker queue and ordered six-stage orchestration
 * (Analyzer → Mapper → Generator → Validator → Reporter → ZIP Exporter).
 * Checkpointing and early-failure reporter path. Typed injectable stage interfaces
 * for testability; real wiring waits for all stages (T024-T054).
 * 
 * T060: Extended with failure publication, interrupted job recovery, and queue resume.
 */

/**
 * Represents an accepted migration job at any stage.
 * State machine: accepted → running → (completed | failed)
 * 
 * T060: Added errorHistory for tracking original + secondary errors.
 */
export interface MigrationJob {
    readonly migrationId: string;
    state: "accepted" | "running" | "completed" | "failed";
    errorHistory: readonly MigrationError[];
}

/**
 * Error record for failed migrations (T060).
 * Tracks original cause and secondary failures during recovery.
 */
export interface MigrationError {
    readonly timestamp: string;
    readonly stage: string; // "analyzer" | "mapper" | "generator" | "validator" | "reporter" | "exporter"
    readonly reason: string;
    readonly message: string;
    readonly isPrimary: boolean; // true for original failure, false for secondary (e.g., diagnostic export failure)
}

/**
 * Input to submit a new migration project for analysis and generation.
 */
export interface MigrationInput {
    readonly body: unknown; // Will be the uploaded ZIP bytes
    readonly contentType: string | null;
}

/**
 * Service interface for managing migrations through their lifecycle.
 * Single-worker queue ensures one active job at a time.
 * 
 * T060: Added methods for failure handling and queue recovery.
 */
export interface IMigrationService {
    /**
     * Accept and queue a new project for migration.
     * Returns immediately with accepted status (202).
     */
    submit(input: MigrationInput): Promise<{ readonly migrationId: string }>;

    /**
     * Get current status of a migration job.
     * Returns null if job not found or has expired.
     */
    getStatus(migrationId: string): Promise<MigrationJob | null>;

    /**
     * Mark a migration as failed (T060).
     * Records the original failure cause.
     * Later called again with secondary errors if recovery fails (e.g., diagnostic export).
     */
    failMigration(
        migrationId: string,
        stage: string,
        reason: string,
        message: string,
        isPrimary: boolean
    ): Promise<void>;

    /**
     * Resume the accepted queue after recovery (T060).
     * Checks for interrupted running jobs and recovers them.
     */
    resumeQueue(): Promise<void>;

    /**
     * Recover an interrupted running job (T060).
     * Marks job with PROCESS_INTERRUPTED and triggers failure report generation.
     */
    recoverInterruptedJob(migrationId: string): Promise<void>;
}

/**
 * In-memory migration service for testing and initial implementation.
 * Real implementation will use MigrationStore for durability.
 * 
 * T060: Implements failure handling and queue recovery.
 * TODO (T043): Replace with real service using MigrationStore, stage orchestration,
 * and publication wiring from T055.
 */
export class InMemoryMigrationService implements IMigrationService {
    private jobs = new Map<string, MigrationJob>();
    private nextId = 0;
    private activeJobId: string | null = null;
    private queue: string[] = [];

    public submit(): Promise<{ readonly migrationId: string }> {
        this.nextId += 1;
        // Generate UUID v4 format for migrationId
        const migrationId = `00000000-0000-4000-8000-${String(this.nextId).padStart(12, "0")}`;
        const job: MigrationJob = {
            migrationId,
            state: "accepted",
            errorHistory: []
        };
        this.jobs.set(migrationId, job);
        this.queue.push(migrationId);
        return Promise.resolve({ migrationId });
    }

    public getStatus(migrationId: string): Promise<MigrationJob | null> {
        return Promise.resolve(this.jobs.get(migrationId) ?? null);
    }

    public async failMigration(
        migrationId: string,
        stage: string,
        reason: string,
        message: string,
        isPrimary: boolean
    ): Promise<void> {
        const job = this.jobs.get(migrationId);
        if (!job) {
            throw new Error(`Migration not found: ${migrationId}`);
        }

        // Record error in history
        const error: MigrationError = {
            timestamp: new Date().toISOString(),
            stage,
            reason,
            message,
            isPrimary
        };

        (job.errorHistory as unknown[]).push(error);

        // Mark as failed
        job.state = "failed";

        // If this is the active job, clear it to allow queue to resume
        if (this.activeJobId === migrationId) {
            this.activeJobId = null;
        }
    }

    public async resumeQueue(): Promise<void> {
        // Check for interrupted running jobs and recover them
        for (const [migrationId, job] of this.jobs.entries()) {
            if (job.state === "running") {
                // This job was interrupted
                await this.recoverInterruptedJob(migrationId);
            }
        }

        // Resume processing accepted queue
        if (!this.activeJobId && this.queue.length > 0) {
            const nextJobId = this.queue[0];
            if (nextJobId !== undefined) {
                const nextJob = this.jobs.get(nextJobId);
                if (nextJob && nextJob.state === "accepted") {
                    this.activeJobId = nextJobId;
                    nextJob.state = "running";
                }
            }
        }
    }

    public async recoverInterruptedJob(migrationId: string): Promise<void> {
        const job = this.jobs.get(migrationId);
        if (!job) {
            throw new Error(`Migration not found: ${migrationId}`);
        }

        // Mark as failed with PROCESS_INTERRUPTED reason
        await this.failMigration(migrationId, "recovery", "PROCESS_INTERRUPTED", "Process was interrupted", true);
    }
}
