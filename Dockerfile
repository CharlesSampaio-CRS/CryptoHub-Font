FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile
RUN pnpm add @react-native-picker/picker@2.11.1

COPY . .

EXPOSE 8081
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081 || exit 1
CMD ["pnpm", "web"]
