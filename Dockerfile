FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS migrator
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/core/db/migrations ./src/core/db/migrations
COPY scripts/migrate.cjs ./scripts/migrate.cjs
USER node
CMD ["node", "scripts/migrate.cjs"]

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Non-secret build-time placeholders; the runner receives real values at runtime.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
ENV APP_ORIGIN=http://localhost:3000
ENV SESSION_SECRET=build-session-secret-000000000000000000
ENV REGISTRATION_TICKET_SECRET=build-ticket-secret-0000000000000000
ENV OAUTH_CLIENT_ID=build-client-id
ENV OAUTH_CLIENT_SECRET=build-client-secret
ENV TMDB_ACCESS_TOKEN=build-tmdb-token
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
