FROM oven/bun:canary-alpine as base

WORKDIR /usr/src/app

FROM base AS install

RUN apk update && apk add cmake g++

RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --verbose --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --verbose --frozen-lockfile --production

FROM node:20.10.0 as prerelease

WORKDIR /usr/src/app

COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN npm run build -- --debug

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/.next .next
COPY --from=prerelease /usr/src/app/package.json .

EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "start" ]
