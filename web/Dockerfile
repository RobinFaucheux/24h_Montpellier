# Stage 1: Install dependencies
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Stage 2: Build
FROM node:22-alpine AS builder
ENV CI=true
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm build

# Stage 3: Production runtime
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node .output/server/index.mjs"]
