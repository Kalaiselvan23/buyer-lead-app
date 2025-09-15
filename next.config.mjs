/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force the base path and asset prefix to be consistent
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  basePath: '',
}

export default nextConfig
