# syntax=docker/dockerfile:1
FROM oven/bun:latest
WORKDIR /app
# Copy the entire repository (needed for workspace packages)
COPY . .
# Install all workspace dependencies
RUN bun install --frozen-lockfile
# Set working directory to the Web sub‑folder
WORKDIR /app/apps/web
# Expose Vite dev port (default 5173)
EXPOSE 5173
# Run the web dev server
CMD ["bun", "run", "--filter", "web", "dev"]
