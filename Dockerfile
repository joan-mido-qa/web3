FROM oven/bun:canary-alpine as base

WORKDIR /usr/src/app

FROM base AS install

RUN apk update && apk add cmake g++

RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

FROM base AS release

COPY --from=install /temp/dev/node_modules node_modules
COPY --from=install /temp/dev/package.json .

COPY . .

EXPOSE 3000/tcp

ENTRYPOINT [ "bun", "run", "dev" ]
