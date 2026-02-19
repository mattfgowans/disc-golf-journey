import type { NextConfig } from "next";

const isGithub = process.env.DEPLOY_TARGET === "github";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithub ? "/disc-golf-journey" : "",
  assetPrefix: isGithub ? "/disc-golf-journey/" : "",
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
