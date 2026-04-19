# syntax=docker/dockerfile:1
FROM oven/bun:latest
WORKDIR /app
# Copy the entire repository (needed for workspace packages)
COPY . .
# Install all workspace dependencies
RUN bun install --frozen-lockfile
# Set working directory to the API sub‑folder
WORKDIR /app/apps/api
# Expose API port
EXPOSE 3000
# Run the API dev server (uses local SQLite DB)
CMD ["bun", "src/dev.ts"]
