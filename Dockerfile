# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Build applications
RUN cd backend && npm run build
RUN cd frontend && npm run build

# Production stage
FROM node:18-alpine AS production

# Install security updates and required packages
RUN apk add --no-cache \
    dumb-init \
    && apk upgrade

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S dca-bot -u 1001

# Set working directory
WORKDIR /app

# Copy built backend
COPY --from=builder --chown=dca-bot:nodejs /app/backend/dist ./backend/dist
COPY --from=builder --chown=dca-bot:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=dca-bot:nodejs /app/backend/package*.json ./backend/

# Copy built frontend
COPY --from=builder --chown=dca-bot:nodejs /app/frontend/build ./frontend/build

# Create data directory for database
RUN mkdir -p /app/data && chown -R dca-bot:nodejs /app/data

# Switch to non-root user
USER dca-bot

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "backend/dist/server.js"]