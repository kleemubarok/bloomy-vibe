# syntax=docker/dockerfile:1
FROM oven/bun:latest

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
COPY apps/web/package.json ./apps/web/package.json
RUN bun install --frozen-lockfile

# Copy rest of worktree
COPY . .

# Expose Vite dev port (default 5173)
EXPOSE 5173

# Run the web dev server
CMD ["bun", "run", "--filter", "web", "dev"]
