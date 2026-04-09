# ─── Stage 1: Build the React frontend ───────────────────────────────────────
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ─── Stage 2: Install backend dependencies ────────────────────────────────────
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY backend/ .
# Embed the compiled frontend
COPY --from=frontend-build /app/frontend/build ./public

# ─── Stage 3: Lean production image ──────────────────────────────────────────
FROM node:18-alpine
WORKDIR /app
COPY --from=backend-build /app/backend .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
