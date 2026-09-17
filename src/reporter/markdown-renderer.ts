/**
 * Renders a ReportBundle as Markdown (T016/T049). Reads only the report record — no
 * separate Markdown data model — and escapes every source-supplied string so untrusted
 * project content can never inject Markdown/HTML into the rendered report.
 */
import type { ReportBundle } from "./report-model.js";

/** Escapes Markdown control characters and neutralizes raw HTML tags/entities. */
function escapeMarkdown(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/([\\`*_{}[\]()#+\-.!|])/g, "\\$1");
}

function mdTableRow(cells: readonly string[]): string {
    return `| ${cells.map((cell) => escapeMarkdown(cell)).join(" | ")} |`;
}

function renderSection(title: string, body: string): string {
    return `## ${title}\n\n${body}\n`;
}

function renderSummary(report: ReportBundle): string {
    const lines = [
        mdTableRow(["Field", "Value"]),
        mdTableRow(["---", "---"]),
        mdTableRow(["Migration ID", report.migrationId]),
        mdTableRow(["Outcome", report.outcome]),
        mdTableRow(["Created At", report.createdAt]),
        mdTableRow(["Source Framework", report.sourceFramework]),
        mdTableRow(["Source Version", report.sourceVersion ?? "(unknown)"]),
        mdTableRow(["Target Profile", report.targetProfileId ?? "(none)"]),
        mdTableRow(["Coverage", report.coverage]),
        mdTableRow([
            "Catalog",
            `${report.catalog.revision} (${String(report.catalog.entryCount)} entries, sha256 ${report.catalog.sha256})`
        ])
    ];
    return renderSection("Summary", lines.join("\n"));
}

function renderCounts(report: ReportBundle): string {
    const { counts } = report;
    const lines = [
        mdTableRow(["Detected", "Mapped", "Unmapped", "Manual review"]),
        mdTableRow(["---", "---", "---", "---"]),
        mdTableRow([
            String(counts.detected),
            String(counts.mapped),
            String(counts.unmapped),
            String(counts.manualReview)
        ])
    ];
    return renderSection("Mapping counts", lines.join("\n"));
}

function renderStages(report: ReportBundle): string {
    const lines = [
        mdTableRow(["Stage", "Status", "Reason"]),
        mdTableRow(["---", "---", "---"]),
        ...report.stages.map((s) => mdTableRow([s.stage, s.status, s.reason ?? ""]))
    ];
    return renderSection("Pipeline stages", lines.join("\n"));
}

function renderValidation(report: ReportBundle): string {
    const lines = [
        mdTableRow(["Gate", "Status", "Exit code", "Duration (ms)", "Reason"]),
        mdTableRow(["---", "---", "---", "---", "---"]),
        ...report.validationResults.map((v) =>
            mdTableRow([
                v.gate,
                v.status,
                v.exitCode === null ? "" : String(v.exitCode),
                v.durationMs === null ? "" : String(v.durationMs),
                v.reason ?? ""
            ])
        )
    ];
    return renderSection("Validation gates", lines.join("\n"));
}

function renderMappings(report: ReportBundle): string {
    if (report.mappings.length === 0) {
        return renderSection("Mappings", "_No UI elements were detected or mapped for this attempt._");
    }
    const lines = [
        mdTableRow(["Source file", "Source element", "Status", "Target", "Reason"]),
        mdTableRow(["---", "---", "---", "---", "---"]),
        ...report.mappings.map((m) =>
            mdTableRow([m.sourceFile, m.sourceElement, m.status, m.targetEntryId ?? "", m.reason])
        )
    ];
    return renderSection("Mappings", lines.join("\n"));
}

function renderPreservationFindings(report: ReportBundle): string {
    if (report.preservationFindings.length === 0) {
        return renderSection("Preservation findings", "_None recorded._");
    }
    const lines = [
        mdTableRow(["Behavior", "Outcome", "Blocking", "Reason", "Source files"]),
        mdTableRow(["---", "---", "---", "---", "---"]),
        ...report.preservationFindings.map((f) =>
            mdTableRow([f.behavior, f.outcome, f.blocking ? "yes" : "no", f.reason, f.sourceFiles.join(", ")])
        )
    ];
    return renderSection("Preservation findings", lines.join("\n"));
}

function renderFindings(title: string, findings: ReportBundle["warnings"]): string {
    if (findings.length === 0) {
        return renderSection(title, "_None._");
    }
    const lines = [
        mdTableRow(["Code", "Severity", "Message", "Source files"]),
        mdTableRow(["---", "---", "---", "---"]),
        ...findings.map((f) => mdTableRow([f.code, f.severity, f.message, f.sourceFiles.join(", ")]))
    ];
    return renderSection(title, lines.join("\n"));
}

/** Renders the full Markdown report from exactly the given report record. */
export function renderReportMarkdown(report: ReportBundle): string {
    return [
        `# Migration report: ${escapeMarkdown(report.migrationId)}\n`,
        renderSummary(report),
        renderCounts(report),
        renderStages(report),
        renderValidation(report),
        renderMappings(report),
        renderPreservationFindings(report),
        renderFindings("Warnings", report.warnings),
        renderFindings("Errors", report.errors)
    ].join("\n");
}
