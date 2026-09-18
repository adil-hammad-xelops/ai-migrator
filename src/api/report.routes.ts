/**
 * Report delivery routes (T050): Serve published terminal reports in JSON or Markdown.
 * Only terminal reports (outcome completed/failed with final publication) are served;
 * private candidate revisions never leak before publication.
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ReportBundle } from "../reporter/report-model.js";
import { renderReportMarkdown } from "../reporter/markdown-renderer.js";

interface ReportStatus {
    readonly reportAvailable: boolean;
    readonly outcome?: "completed" | "failed";
    readonly revision?: string;
}

interface ReportService {
    getReportStatus(migrationId: string): Promise<ReportStatus | null>;
    getReport(migrationId: string): Promise<ReportBundle | null>;
}

interface RouteDependencies {
    readonly service: ReportService;
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function registerReportRoutes(app: FastifyInstance, dependencies: RouteDependencies): void {
    app.get<{ Params: { migrationId: string }; Querystring: { format?: string } }>(
        "/api/migrations/:migrationId/report",
        async (request: FastifyRequest<{ Params: { migrationId: string }; Querystring: { format?: string } }>, reply: FastifyReply) => {
            const { migrationId } = request.params;
            const querystring = request.query as { format?: string };
            const { format = "json" } = querystring;

            // Validate migrationId format
            if (!isUuid(migrationId)) {
                return reply.code(400).send({
                    code: "INVALID_REQUEST",
                    message: "migrationId must be a valid UUID"
                });
            }

            // Validate format parameter
            if (format !== "json" && format !== "md") {
                return reply.code(400).send({
                    code: "INVALID_REQUEST",
                    message: 'format must be "json" or "md"'
                });
            }

            // Check if migration/report exists
            const status = await dependencies.service.getReportStatus(migrationId);

            if (status === null) {
                return reply.code(404).send({
                    code: "NOT_FOUND",
                    message: "migration not found or has expired"
                });
            }

            // If report not yet available, return 202 pending
            if (!status.reportAvailable) {
                return reply.code(202).send({
                    migrationId,
                    reportAvailable: false,
                    message: "report is pending publication"
                });
            }

            // Fetch and serve the published report
            const report = await dependencies.service.getReport(migrationId);

            if (report === null) {
                // This can happen if storage is temporarily unavailable
                return reply.code(503).send({
                    code: "SERVICE_UNAVAILABLE",
                    message: "report storage temporarily unavailable"
                });
            }

            if (format === "md") {
                // Render as Markdown
                const markdown = renderReportMarkdown(report);
                return reply.code(200).type("text/markdown").send(markdown);
            } else {
                // Return as JSON (default)
                return reply.code(200).type("application/json").send(report);
            }
        }
    );
}
