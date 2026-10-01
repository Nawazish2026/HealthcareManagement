# ----------------------------------------------------
# Stage 1: Build stage
# ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies needed for native modules
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for compilation)
RUN npm ci --legacy-peer-deps

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Compile TypeScript to JavaScript
RUN npm run build

# ----------------------------------------------------
# Stage 2: Production runner
# ----------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=4000

# Create a non-root group and user for security compliance
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled files and required assets from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

USER appuser

EXPOSE 4000

CMD ["node", "dist/server.js"]
