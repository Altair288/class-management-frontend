/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // 优先使用容器环境变量 INTERNAL_API_BASE，否则回退到 docker compose 服务名 backend
    const base = process.env.INTERNAL_API_BASE || 'http://backend:8080';
    return [
      {
        source: '/api/:path*',
        destination: `${base}/api/:path*`, // 容器内部转发到后端
      },
    ];
  },
};

module.exports = nextConfig;
