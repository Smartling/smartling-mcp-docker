FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist/ ./dist/
RUN mkdir -p /workspace/input /workspace/output && chown appuser:appgroup /workspace/input /workspace/output

USER appuser
EXPOSE 3000
CMD ["node", "dist/main.js"]
