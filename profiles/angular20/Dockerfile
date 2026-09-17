# Disposable validation sandbox image (T014). Node 24.15.0 to match the backend/profile
# pin (research.md § 1). Non-root by default; the runner also enforces --user/--cap-drop
# at `docker run` time so this Dockerfile is defense-in-depth, not the sole boundary.
FROM node:24.15.0-bookworm-slim

# No root shell tools beyond what npm/Angular CLI need; no docker/container management
# tooling, no SSH, no package manager credentials baked in.
RUN useradd --create-home --uid 10001 --shell /usr/sbin/nologin sandbox \
    && mkdir -p /workspace/app /workspace/work \
    && chown -R sandbox:sandbox /workspace

USER sandbox
WORKDIR /workspace/work

# No ENTRYPOINT/CMD: the sandbox runner always supplies an explicit argv, never a shell.
