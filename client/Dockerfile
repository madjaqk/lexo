# Build the React front-end
FROM node:24-alpine as build

# RUN apk add --no-cache libc6-compat  # TODO: Is this line actually necessary?

WORKDIR /app

RUN corepack enable
COPY ./pnpm-lock.yaml ./package.json ./
RUN pnpm install --frozen-lockfile

COPY ./ .
RUN pnpm run build



FROM caddy:2.10-alpine

COPY --from=build /app/build/dist /usr/share/caddy/html
COPY ./Caddyfile /etc/caddy/Caddyfile
