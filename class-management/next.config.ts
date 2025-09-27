/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生成精简可部署的 standalone 目录，便于 Docker 只拷贝必需文件
  output: 'standalone',
  async rewrites() {
    const isDocker = process.env.DOCKER === 'true';
    return [
      {
      source: '/api/:path*',
      destination: isDocker
        ? 'http://backend:8080/api/:path*'
        : 'http://localhost:8080/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;