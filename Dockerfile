FROM node:24-bookworm-slim AS node-base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

FROM node-base AS api-build
WORKDIR /build/api
COPY apps/api/package*.json ./
COPY apps/api/prisma ./prisma
RUN npm ci && npm run prisma:generate
COPY apps/api/src ./src
COPY apps/api/tsconfig*.json apps/api/nest-cli.json ./
RUN npm run build

FROM node-base AS web-build
WORKDIR /build/web
COPY apps/web/package*.json ./
RUN npm ci
COPY apps/web/ ./
ENV NEXT_PUBLIC_API_URL=/api BREWLITE_SINGLE_CONTAINER=true NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM postgres:16-bookworm AS demo
RUN apt-get update && apt-get install -y --no-install-recommends tini ca-certificates openssl libstdc++6 libatomic1 && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 1000 brewlite && useradd --uid 1000 --gid brewlite --create-home brewlite
COPY --from=node-base /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY --from=api-build --chown=brewlite:brewlite /build/api/node_modules ./api/node_modules
COPY --from=api-build --chown=brewlite:brewlite /build/api/dist ./api/dist
COPY --from=api-build --chown=brewlite:brewlite /build/api/prisma ./api/prisma
COPY --from=api-build --chown=brewlite:brewlite /build/api/package*.json ./api/
COPY --from=web-build --chown=brewlite:brewlite /build/web/.next/standalone ./web/
COPY --from=web-build --chown=brewlite:brewlite /build/web/.next/static ./web/.next/static
COPY --from=web-build --chown=brewlite:brewlite /build/web/public ./web/public
COPY docker/demo-entrypoint.sh /usr/local/bin/brewlite-demo
RUN sed -i 's/\r$//' /usr/local/bin/brewlite-demo && chmod 755 /usr/local/bin/brewlite-demo
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 \
    POSTGRES_USER=brewlite POSTGRES_DB=brewlite \
    PGDATA=/var/lib/brewlite/postgres SEED_DEMO_USERS=true
VOLUME ["/var/lib/brewlite"]
EXPOSE 3000
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=10s --timeout=5s --start-period=90s --retries=6 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/usr/bin/tini", "-g", "--", "/usr/local/bin/brewlite-demo"]
