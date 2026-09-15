# ==========================================
# Multi-stage Dockerfile for Network Connectivity Doctor
# ==========================================

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json ./

# Install dependencies for building
RUN npm install

# Copy application source code and configuration
COPY tsconfig.json vite.config.ts index.html metadata.json ./
COPY src/ ./src/
COPY public/ ./public/
COPY server.ts ./

# Build client SPA and compile server.ts into dist/server.cjs
RUN npm run build

# Stage 2: Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package.json and install production-only dependencies
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled distribution from builder
COPY --from=builder /app/dist ./dist

# Create storage directory for uploaded reports and adjust permissions
RUN mkdir -p /app/data/reports && chown -R node:node /app/data

# Switch to non-root node user
USER node

# Expose web service port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
