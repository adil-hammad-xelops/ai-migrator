/**
 * Fastify app factory (T017). Bearer auth runs before every route (including 404s),
 * rate limiting is keyed per-token, and error responses never leak internals. Route
 * registration (migration/report/download) lands in later tasks (T044/T050/T056/T061);
 * listening stays in src/index.ts.
 */
import { timingSafeEqual } from "node:crypto";
import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyError } from "fastify";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import type { AppConfig } from "./config.js";

export interface BuildAppOptions {
    readonly config: AppConfig;
}

const BEARER_PATTERN = /^Bearer\s+(.+)$/;

function extractBearerToken(request: FastifyRequest): string | null {
    const header = request.headers.authorization;
    if (typeof header !== "string") {
        return null;
    }
    const match = BEARER_PATTERN.exec(header);
    return match?.[1] ?? null;
}

/** Constant-time comparison so token verification does not leak length/prefix via timing. */
function isValidToken(candidate: string, expected: string): boolean {
    const candidateBuffer = Buffer.from(candidate, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (candidateBuffer.length !== expectedBuffer.length) {
        // Still run a same-length comparison so the early return does not itself leak timing.
        timingSafeEqual(expectedBuffer, expectedBuffer);
        return false;
    }
    return timingSafeEqual(candidateBuffer, expectedBuffer);
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
    const { config } = options;
    const app = Fastify({
        logger: true,
        bodyLimit: config.maxCompressedUploadBytes + 64 * 1024,
        trustProxy: false
    });

    await app.register(sensible);
    await app.register(multipart, {
        limits: {
            fileSize: config.maxCompressedUploadBytes,
            files: 1
        }
    });
    await app.register(rateLimit, {
        global: true,
        max: config.rateLimitPerMinutePerToken,
        timeWindow: "1 minute",
        keyGenerator: (request: FastifyRequest): string => extractBearerToken(request) ?? request.ip
    });

    // Runs before route matching resolves, so unauthenticated requests can never reach a
    // handler — including for status/report/download routes registered by later tasks.
    app.addHook("onRequest", async (request, reply) => {
        const token = extractBearerToken(request);
        if (token === null || !isValidToken(token, config.authToken)) {
            await reply.code(401).send({ code: "UNAUTHORIZED", message: "missing or invalid bearer token" });
        }
    });

    app.setErrorHandler((error: FastifyError, request, reply) => {
        request.log.error({ err: error }, "request failed");
        const statusCode = typeof error.statusCode === "number" ? error.statusCode : 500;
        const code = statusCode === 500 ? "INTERNAL_ERROR" : error.code;
        const message = statusCode === 500 ? "internal server error" : error.message;
        void reply.code(statusCode).send({ code, message });
    });

    app.setNotFoundHandler((request, reply) => {
        void reply.code(404).send({ code: "NOT_FOUND", message: "resource not found" });
    });

    return app;
}
