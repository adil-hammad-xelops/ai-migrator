import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

/**
 * T061: Migration status endpoint reflects historical outcome immutably.
 * Outcome is NOT inferred from current artifact existence.
 * Artifact/diagnostic availability is current projection (may be expired).
 */

interface AcceptedJob {
    readonly migrationId: string;
    readonly state: "accepted" | "running" | "completed" | "failed";
    readonly outcome?: "success" | "failed"; // T061: Historical outcome (immutable)
    readonly [key: string]: unknown;
}

interface MigrationRouteService {
    submit(input?: { readonly body: unknown; readonly contentType: string | null }): Promise<{ readonly migrationId: string }>;
    getStatus(migrationId: string): Promise<AcceptedJob | null>;
}

interface RouteDependencies {
    readonly service: MigrationRouteService;
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function pendingStatus(job: AcceptedJob): Record<string, unknown> {
    return {
        migrationId: job.migrationId,
        state: job.state,
        outcome: job.outcome, // T061: Historical immutable outcome, not inferred from files
        reportAvailable: false,
        currentStage: null,
        stages: [],
        counts: { detected: 0, mapped: 0, unmapped: 0, manualReview: 0 },
        coverage: "unknown",
        // T061: These are current projections, not outcome basis
        finalArtifact: { available: false, url: null, sha256: null, bytes: null, expiresAt: null },
        diagnosticArtifact: { available: false, url: null, sha256: null, bytes: null, expiresAt: null },
        warnings: [],
        errors: [],
    };
}

export function registerMigrationRoutes(app: FastifyInstance, dependencies: RouteDependencies): void {
    app.post("/api/migrations", async (request: FastifyRequest, reply: FastifyReply) => {
        const contentType = request.headers["content-type"] ?? null;
        const result = await dependencies.service.submit({ body: request.body, contentType });
        const base = `/api/migrations/${result.migrationId}`;
        return reply
            .code(202)
            .header("location", base)
            .send({
                migrationId: result.migrationId,
                state: "accepted",
                links: {
                    status: base,
                    report: `${base}/report`,
                    download: `${base}/download`,
                    diagnosticDownload: `${base}/diagnostic-download`,
                },
            });
    });

    app.get<{ Params: { migrationId: string } }>("/api/migrations/:migrationId", async (request, reply) => {
        const { migrationId } = request.params;
        if (!isUuid(migrationId)) {
            return reply.code(404).send({ code: "NOT_FOUND", message: "resource not found" });
        }
        const job = await dependencies.service.getStatus(migrationId);
        if (job === null) {
            return reply.code(404).send({ code: "NOT_FOUND", message: "resource not found" });
        }
        return reply.code(200).send(pendingStatus(job));
    });
}
