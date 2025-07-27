# EHB Agent Platform - Docker Configuration
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs memory database

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000
ENV MONGODB_URI=mongodb://mongo:27017/ehb_agent
ENV JWT_SECRET=ehb-agent-production-secret-2025
ENV JWT_EXPIRY=24h

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Start the application
CMD ["node", "app.js"]
