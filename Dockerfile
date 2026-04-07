# Dockerfile

# Stage 1: Build the frontend
FROM node:16 AS frontend-build
WORKDIR /app/frontend
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install
COPY ./frontend/ .
RUN npm run build

# Stage 2: Build the backend
FROM node:16 AS backend-build
WORKDIR /app/backend
COPY ./backend/package.json ./backend/package-lock.json ./
RUN npm install
COPY ./backend/ .
COPY --from=frontend-build /app/frontend/build ./public

# Stage 3: Final image
FROM node:16
WORKDIR /app
COPY --from=backend-build /app/backend .
EXPOSE 3000
CMD [ "npm", "start" ]
