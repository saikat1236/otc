# Multi-stage Dockerfile for unified Node fullstack deployment
FROM node:22-alpine

WORKDIR /app

# Copy root and client package definitions
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN npm --prefix client install

# Copy application source code
COPY . .

# Build React PWA into client/dist
RUN npm --prefix client run build

# Expose default port
EXPOSE 5000

ENV NODE_ENV=production

# Start unified server
CMD ["node", "server/server.js"]
