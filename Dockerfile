# Runs MentHers as one container (frontend built in, served by the backend).
# Works on Fly.io, Railway, Google Cloud Run and similar hosts.
FROM node:22-slim

WORKDIR /app

COPY frontend/package*.json frontend/
RUN npm --prefix frontend ci

COPY backend/package*.json backend/
RUN npm --prefix backend ci --omit=dev

COPY frontend frontend
RUN npm --prefix frontend run build

COPY backend backend

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "backend/src/server.js"]
