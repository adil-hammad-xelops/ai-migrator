/**
 * Download routes (T056): GET /api/migrations/{migrationId}/download
 * Returns published final artifact as ZIP stream with proper headers.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export interface DownloadService {
    getDownloadStatus(migrationId: string): Promise<{ available: boolean; reason?: string } | null>;
    downloadArtifact(migrationId: string): Promise<Buffer | null>;
}

export interface DownloadDependencies {
    readonly service: DownloadService;
}

/**
 * Validates a UUID v4 format.
 * Used for migrationId parameter validation.
 */
function isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
}

/**
 * Registers download routes on the app.
 */
export function registerDownloadRoutes(
    app: FastifyInstance,
    dependencies: DownloadDependencies
): void {
    const { service } = dependencies;

    /**
     * GET /api/migrations/{migrationId}/download
     * Download the published final artifact (ZIP).
     *
     * Responses:
     * - 200: Success, ZIP stream
     * - 400: Invalid UUID format
     * - 401: Missing or invalid authorization
     * - 404: Migration not found or has no published artifact
     * - 409: Migration is active or has failed
     * - 503: Service unavailable
     */
    app.get<{ Params: { migrationId: string } }>(
        "/api/migrations/:migrationId/download",
        async (request: FastifyRequest<{ Params: { migrationId: string } }>, reply: FastifyReply) => {
            try {
                const { migrationId } = request.params;

                // Validate UUID format
                if (!isValidUUID(migrationId)) {
                    return reply.code(400).send({
                        error: "Invalid migrationId format",
                        details: "migrationId must be a valid UUID v4"
                    });
                }

                // Check download status
                const status = await service.getDownloadStatus(migrationId);
                if (status === null) {
                    // Migration not found
                    return reply.code(404).send({
                        error: "Migration not found",
                        migrationId
                    });
                }

                if (!status.available) {
                    // Migration is active, failed, or not ready
                    if (status.reason === "active" || status.reason === "failed") {
                        return reply.code(409).send({
                            error: "Download not available",
                            reason: status.reason
                        });
                    }
                    // Other reasons default to 404
                    return reply.code(404).send({
                        error: "Artifact not yet available",
                        reason: status.reason
                    });
                }

                // Download the artifact
                const artifact = await service.downloadArtifact(migrationId);
                if (!artifact) {
                    return reply.code(404).send({
                        error: "Artifact not found",
                        migrationId
                    });
                }

                // Set response headers for file download
                reply.header("Content-Type", "application/zip");
                reply.header("Content-Length", artifact.length);
                reply.header("Content-Disposition", `attachment; filename="migration-${migrationId}.zip"`);
                reply.header("Cache-Control", "private, max-age=3600");

                // Send artifact
                return reply.send(artifact);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.error(`Download error for ${request.params.migrationId}:`, message);
                return reply.code(503).send({
                    error: "Service unavailable",
                    details: message
                });
            }
        }
    );
}
