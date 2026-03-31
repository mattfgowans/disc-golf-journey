/** @type {import('next').NextConfig} */
const isGithub = process.env.DEPLOY_TARGET === "github";

const nextConfig = {
  output: "standalone",
  basePath: isGithub ? "/disc-golf-journey" : "",
  assetPrefix: isGithub ? "/disc-golf-journey/" : "",
  trailingSlash: false,
  images: { unoptimized: true },
  experimental: { appDir: true, serverComponentsExternalPackages: [] },
  typescript: { ignoreBuildErrors: false },
};

module.exports = nextConfig;
