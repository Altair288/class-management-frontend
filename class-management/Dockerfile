# ================================
# Frontend (Next.js 15 / React 19)
# Node 24.7.0
# 生产模式：使用多阶段减少体积
# ================================

# ---- Base deps layer ----
FROM node:24.7.0-bookworm-slim AS deps
WORKDIR /app

# 仅复制依赖文件以便缓存
# 复制 package* 以命中 package.json 和 package-lock.json（若存在）
COPY package*.json ./
# 可选传入其他锁文件（若有即可缓存），不存在不会影响安装
COPY yarn.lock* ./
COPY pnpm-lock.yaml* ./
RUN --mount=type=cache,target=/root/.npm npm set fund false \
  && npm install --legacy-peer-deps --no-audit --no-progress

# ---- Build layer ----
FROM node:24.7.0-bookworm-slim AS build
WORKDIR /app
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建 Next.js (生成 .next)
RUN npm run build

# ---- Runtime layer ----
FROM node:24.7.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# 仅复制运行所需文件
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

# 如果使用 next start 模式，需要保留 .next & node_modules
# 端口与脚本保持一致
EXPOSE 4000
ENV PORT=4000

# 健康检查可在 compose 中定义 (示例：curl -f http://localhost:4000 || exit 1)

CMD ["npm", "run", "start"]
