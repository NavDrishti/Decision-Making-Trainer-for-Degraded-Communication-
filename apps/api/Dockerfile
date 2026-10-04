FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configs
COPY package.json package-lock.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm ci

# Copy API source and prisma schema
COPY apps/api ./apps/api

WORKDIR /app/apps/api

# Generate Prisma Client & Build TypeScript
RUN npx prisma generate
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install openssl for prisma runtime
RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared-types ./packages/shared-types
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && npm run seed && node dist/index.js"]
