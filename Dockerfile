# Build stage
FROM node:22.12.0-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22.12.0-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/public ./public

# Set environment to production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Node.js performance tuning
# Adjust max-old-space-size based on available memory (4GB = 3072MB for app)
ENV NODE_OPTIONS="--max-old-space-size=3072"

# Expose port
EXPOSE 3000

# Start the application with cluster mode for better CPU utilization
CMD ["node", "server/cluster.mjs"]
