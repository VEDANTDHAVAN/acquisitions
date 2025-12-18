# syntax=docker/dockerfile:1

# ---- Base stage with common dependencies ----
FROM node:18-alpine AS base

# Install system dependencies needed for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# ---- Dependencies stage ----
FROM base AS dependencies

# Install all dependencies (dev + prod)
RUN npm ci --include=dev

# ---- Production dependencies stage ----
FROM base AS prod-dependencies

# Install only production dependencies
RUN npm ci --omit=dev --omit=optional \
  && npm cache clean --force

# ---- Development stage ----
FROM base AS development

# Copy all dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY --chown=nodejs:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const http = require('http'); const req = http.request({hostname: 'localhost', port: 3000, path: '/health'}, (res) => process.exit(res.statusCode === 200 ? 0 : 1)); req.on('error', () => process.exit(1)); req.end();"

CMD ["npm", "run", "dev"]

# ---- Production stage ----
FROM node:18-alpine AS production

# Install only runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    libc6-compat

# Create app user for security
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Set production environment
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=512" \
    PORT=3000

# Copy production dependencies
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=nodejs:nodejs package.json package-lock.json ./
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs drizzle ./drizzle
COPY --chown=nodejs:nodejs drizzle.config.js ./drizzle.config.js

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Health check for production
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "const http = require('http'); const req = http.request({hostname: 'localhost', port: 3000, path: '/health'}, (res) => process.exit(res.statusCode === 200 ? 0 : 1)); req.on('error', () => process.exit(1)); req.end();"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
