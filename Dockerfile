# Прод-образ сайта (standalone Next). Собирается на Windows скриптом deploy/deploy.ps1 и уезжает на сервер
# через реестр на сервере – переносятся только изменённые слои. Секреты (.env) в образ не попадают:
# их передаёт docker compose на сервере (/opt/sites/portfolio/.env)

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# npm run build = next build + postbuild next-sitemap (sitemap и robots.txt в public/)
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
# Медиа – отдельным слоем раньше кода: пока public/ не менялся, при деплое он не переносится заново
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# og-картинки читают шрифты и фото с диска (src/lib/og.tsx)
COPY --from=builder /app/src/app/fonts ./src/app/fonts
COPY --from=builder /app/src/assets/_img/rectangles/title-page ./src/assets/_img/rectangles/title-page
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1
CMD ["node", "server.js"]
