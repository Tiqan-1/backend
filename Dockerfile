# Build stage
FROM node:20-alpine as builder

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
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy any additional necessary files (like config files)
COPY --from=builder /app/nest-cli.json ./
COPY --from=builder /app/tsconfig*.json ./

# Expose the port your app runs on (typically 3000 for NestJS)
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
