# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias primero (aprovecha cache de Docker)
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar el resto del código
COPY . .

# Variables de entorno mínimas para que Next.js compile
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Compilar
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# Copiar solo lo necesario para producción
COPY --from=builder /app/public          ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static    ./.next/static

# Carpeta de uploads con permisos correctos
RUN mkdir -p ./public/uploads/noticias && \
    chown -R nextjs:nodejs ./public/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]