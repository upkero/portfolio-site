# Production image: the built site plus server.mjs (static files and the /live bridge).
# The bridge's service URLs and keys come from the environment at run time, never from the build.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server.mjs ./
COPY server ./server
USER node
EXPOSE 4173
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4173/ >/dev/null || exit 1
CMD ["node", "server.mjs"]
