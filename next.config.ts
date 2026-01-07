import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/disc-golf-journey',
  assetPrefix: '/disc-golf-journey/',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Disable features that don't work with static export
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
