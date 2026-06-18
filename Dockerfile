# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ── Stage 2: Production ────────────────────────────────────────────────────────
FROM node:24-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Patch Alpine CVEs before freezing the image
RUN apk update && apk upgrade --no-cache

# Ensure the non-root 'node' user owns the working directory
RUN chown -R node:node /app

# Switch to the non-root 'node' user for security
USER node

# Copy package files with correct ownership
COPY --chown=node:node package.json package-lock.json ./

# Install prod deps only — keeps image lean, no devDependencies
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy the compiled code from the builder stage with correct ownership
COPY --chown=node:node --from=builder /app/lib ./lib

CMD ["node", "lib/app.js"]
