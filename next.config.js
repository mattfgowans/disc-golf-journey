/** @type {import('next').NextConfig} */
const isGithub = process.env.DEPLOY_TARGET === "github";

const nextConfig = {
  ...(process.env.NODE_ENV === "production"
    ? {
        output: "export",
        basePath: isGithub ? "/disc-golf-journey" : "",
        assetPrefix: isGithub ? "/disc-golf-journey/" : "",
        trailingSlash: true,
      }
    : {}),
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
