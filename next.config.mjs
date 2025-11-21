import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbo: {
    root: __dirname,
  },
  // Ensure proper chunk generation
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
      }
    }
    return config
  },
  // Ensure proper asset prefix for production
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
}

export default nextConfig
