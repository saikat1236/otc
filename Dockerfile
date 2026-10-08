# Stage 1: Build client frontend
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

# Install production dependencies for server
COPY package*.json ./
RUN npm install --omit=dev

# Copy server code
COPY server/ ./server/

# Copy built frontend assets from client-builder
COPY --from=client-builder /app/client/dist ./client/dist

# Default environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose application port
EXPOSE 5000

# Healthcheck using built-in /api/status endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/status || exit 1

# Start unified server
CMD ["node", "server/server.js"]
