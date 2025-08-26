# Build the React front-end
FROM node:24-alpine as build

# RUN apk add --no-cache libc6-compat  # TODO: Is this line actually necessary?

WORKDIR /app

RUN corepack enable
COPY ./pnpm-lock.yaml ./package.json ./
RUN pnpm install --frozen-lockfile

COPY ./ .
RUN pnpm run build



FROM nginx:alpine

COPY --from=build /app/build/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
