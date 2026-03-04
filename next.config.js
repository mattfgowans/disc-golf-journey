/** @type {import('next').NextConfig} */
const isGithub = process.env.DEPLOY_TARGET === "github";

const nextConfig = {
  output: "export",
  basePath: isGithub ? "/disc-golf-journey" : "",
  assetPrefix: isGithub ? "/disc-golf-journey/" : "",
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: { serverComponentsExternalPackages: [] },
  typescript: { ignoreBuildErrors: false },
};

module.exports = nextConfig;
