# syntax=docker/dockerfile:1
FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy only needed files for install
COPY package.json bun.lockb ./
COPY apps/api/package.json ./apps/api/package.json

# Install dependencies (workspace will install all)
RUN bun install --frozen-lockfile

# Copy the rest of the repo
COPY . .

# Expose API port
EXPOSE 3000

# Run the API dev server (uses local SQLite DB)
CMD ["bun", "src/dev.ts"]
