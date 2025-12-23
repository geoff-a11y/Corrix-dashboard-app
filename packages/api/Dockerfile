FROM node:20-alpine

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

WORKDIR /app/packages/api

EXPOSE 3001

CMD ["npm", "start"]
