## Multi-stage Dockerfile for Next.js frontend
## 1. Dependencies install
FROM node:24.7.0-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# 临时使用 --legacy-peer-deps 解决 @material-ui/core 对旧版本 React 类型的 peer 依赖冲突
RUN npm install --legacy-peer-deps --production=false

## 2. Build stage
FROM node:24.7.0-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

## 3. Production runner (can use standalone output later if configured)
FROM node:24.7.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 仅复制 standalone 运行所需文件（内含裁剪后的 node_modules）
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# 可选：若需要在运行期读取 package.json 版本信息再拷贝
COPY --from=build /app/package.json ./package.json

EXPOSE 4000
# standalone 输出的入口 server.js 位于根目录
CMD ["node","server.js"]
