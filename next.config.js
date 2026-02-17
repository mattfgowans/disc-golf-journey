/** @type {import('next').NextConfig} */
const BASE_PATH = '/disc-golf-journey';

const nextConfig = {
  ...(process.env.NODE_ENV === 'production' ? {
    output: 'export',
    basePath: BASE_PATH,
    assetPrefix: `${BASE_PATH}/`,
    trailingSlash: true,
  } : {}),
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
