# ==========================================
# 1. Dependencies Stage
# ==========================================
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

# ==========================================
# 2. Build Stage
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables for Next.js client bundle
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ARG NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ==========================================
# 3. Production Runner Stage
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
