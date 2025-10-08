import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/whentogo',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
