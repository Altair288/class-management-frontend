/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生成精简可部署的 standalone 目录，便于 Docker 只拷贝必需文件
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // 在容器网络中访问后端服务（docker-compose service 名称为 backend）
        destination: 'http://backend:8080/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
