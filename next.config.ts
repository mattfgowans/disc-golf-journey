import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/disc-golf-journey',
  assetPrefix: '/disc-golf-journey/',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
