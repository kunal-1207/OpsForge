# Multi-stage build for Worker service
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nextjs:nodejs . .

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Create a simple healthcheck script
RUN echo '#!/usr/bin/env node\nconst http = require("http");\nconst options = { host: "localhost", port: 3001, path: "/health", timeout: 2000 };\nconst req = http.request(options, (res) => { console.log(`STATUS: ${res.statusCode}`); if (res.statusCode === 200) { process.exit(0); } else { process.exit(1); }});\nreq.on("error", (err) => { console.log("ERROR"); process.exit(1); });\nreq.end();' > healthcheck.js

# Start the application
CMD ["node", "src/worker.js"]