FROM node:20-alpine

# Cache bust: 2026-01-30-v8-metadata
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci --workspace=@corrix/api --workspace=@corrix/shared

# Copy source
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api

# Build shared first, then API
RUN npm run build --workspace=@corrix/shared
RUN npm run build --workspace=@corrix/api

# Copy migrations to dist (they're .sql files, not compiled)
RUN cp -r /app/packages/api/src/db/migrations /app/packages/api/dist/db/

WORKDIR /app/packages/api

# Expose port (Railway sets PORT env var)
EXPOSE 3001

# Start the server
CMD ["node", "dist/index.js"]
