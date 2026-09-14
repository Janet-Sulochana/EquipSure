# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY src/db/schema.sql ./dist/db/schema.sql
COPY src/db/seed.sql ./dist/db/seed.sql

EXPOSE 5000

CMD ["node", "dist/server.js"]
