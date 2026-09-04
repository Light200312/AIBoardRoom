# Frontend Dockerfile - Multi-stage build for React + Vite
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the source code
COPY . .

# Accept build arg and expose to Vite at build time
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the application
RUN npm run build

# Stage 2: Serve with Node
FROM node:20-alpine

WORKDIR /app

# Install a simple HTTP server
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose the frontend port
EXPOSE 3000

# Serve the built files
CMD ["serve", "-s", "dist", "-l", "3000"]