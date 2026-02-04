# Mubadarah Backend

A NestJS-based backend application for the Mubadarah project.

## Description

This project provides the API services for Mubadarah, built with the [Nest](https://github.com/nestjs/nest) framework.

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) are recommended to start the application.
- [npm](https://www.npmjs.com/)

## Project Setup

### 1. Environment Configuration

Copy the example environment file and adjust the values as needed:

```bash
cp .env.example .env
```

### 2. Running with Docker (Recommended for Development)

You can start the entire stack (API and MongoDB) using Docker Compose:

```bash
# Start the development environment
docker-compose -f docker-compose.dev.yml up

# Start in detached mode
docker-compose -f docker-compose.dev.yml up -d

# Stop the services
docker-compose -f docker-compose.dev.yml down
```

The API will be available at `http://localhost:5000`.

### 3. Local Development (Without Docker)

If you prefer to run the API locally, ensure you have a MongoDB instance running (you can use the one from docker-compose).

```bash
# Install dependencies
npm install

# Development mode
npm run start:dev

# Debug mode
npm run start:debug

# Production mode
npm run start:prod
```

## Running Tests

The project uses [Vitest](https://vitest.dev/) for testing.

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## License

This project is UNLICENSED.
