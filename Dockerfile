FROM node:24.15.0-bookworm-slim AS build

WORKDIR /workspace
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version tsconfig.base.json ./
COPY packages/core/package.json packages/core/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/desktop/package.json apps/desktop/package.json
RUN pnpm install --frozen-lockfile

COPY packages/core packages/core
COPY apps/api apps/api
COPY apps/web apps/web
COPY apps/desktop apps/desktop
RUN pnpm --filter @time-tracker/core build \
  && pnpm --filter @time-tracker/web build \
  && pnpm --filter @time-tracker/api build \
  && pnpm --filter @time-tracker/api --prod deploy --legacy /out \
  && mkdir -p /out/public /out/dist/src/migrations \
  && cp -R apps/web/dist/. /out/public/ \
  && cp -R apps/api/src/migrations/. /out/dist/src/migrations/

FROM node:24.15.0-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=3000 \
    STATIC_DIR=/app/public
WORKDIR /app
RUN groupadd --gid 10001 app && useradd --uid 10001 --gid app --create-home app
COPY --from=build --chown=app:app /out ./
USER app
EXPOSE 3000
CMD ["node", "dist/src/server.js"]
