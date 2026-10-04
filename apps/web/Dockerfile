FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configs
COPY package.json package-lock.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy web source
COPY apps/web ./apps/web

WORKDIR /app/apps/web

# Set production build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared-types ./packages/shared-types
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["npm", "start"]
