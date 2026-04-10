# Dockerfile
# Combined single-container build (backend serves built frontend via /public)
# For separate containers see docker/Dockerfile.backend and docker/Dockerfile.frontend

# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm ci
COPY ./frontend/ .
RUN npm run build

# Stage 2: Build the backend
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY ./backend/package.json ./backend/package-lock.json ./
RUN npm ci --only=production
COPY ./backend/ .
COPY --from=frontend-build /app/frontend/build ./public

# Stage 3: Final image
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=backend-build --chown=nodejs:nodejs /app/backend .
USER nodejs
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"
CMD [ "node", "server.js" ]
