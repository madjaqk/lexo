# Build the React front-end
FROM node:24-alpine AS build

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

WORKDIR /app

RUN corepack enable
COPY ./pnpm-lock.yaml ./package.json ./
RUN pnpm install --frozen-lockfile

COPY ./ .
RUN pnpm run build



FROM caddy:2.10-alpine

COPY --from=build /app/build/dist /usr/share/caddy/html
COPY ./Caddyfile /etc/caddy/Caddyfile
