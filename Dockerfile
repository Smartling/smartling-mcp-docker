FROM --platform=linux/amd64 node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/* && \
    curl -fsSL https://smartling-connectors-releases.s3.amazonaws.com/cli/smartling.linux \
      -o /usr/local/bin/smartling-cli && \
    chmod +x /usr/local/bin/smartling-cli

WORKDIR /app

RUN touch smartling.yml

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY src/ src/

CMD ["node", "src/index.js"]
