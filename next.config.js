/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NODE_ENV === 'production' ? {
    output: 'export',
    basePath: '/disc-golf-journey',
  } : {}),
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig 