/**
 * Migration service (T043): Single-worker queue and ordered six-stage orchestration
 * (Analyzer → Mapper → Generator → Validator → Reporter → ZIP Exporter).
 * Checkpointing and early-failure reporter path. Typed injectable stage interfaces
 * for testability; real wiring waits for all stages (T024-T054).
 */

/**
 * Represents an accepted migration job at any stage.
 * State machine: accepted → running → (completed | failed)
 */
export interface MigrationJob {
    readonly migrationId: string;
    state: "accepted" | "running" | "completed" | "failed";
    readonly [key: string]: unknown;
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
}

/**
 * In-memory migration service for testing and initial implementation.
 * Real implementation will use MigrationStore for durability.
 * TODO (T043): Replace with real service using MigrationStore, stage orchestration,
 * and publication wiring from T055.
 */
export class InMemoryMigrationService implements IMigrationService {
    private jobs = new Map<string, MigrationJob>();
    private nextId = 0;

    public submit(): Promise<{ readonly migrationId: string }> {
        this.nextId += 1;
        // Generate UUID v4 format for migrationId
        const migrationId = `00000000-0000-4000-8000-${String(this.nextId).padStart(12, "0")}`;
        this.jobs.set(migrationId, {
            migrationId,
            state: "accepted"
        });
        return Promise.resolve({ migrationId });
    }

    public getStatus(migrationId: string): Promise<MigrationJob | null> {
        return Promise.resolve(this.jobs.get(migrationId) ?? null);
    }
}
