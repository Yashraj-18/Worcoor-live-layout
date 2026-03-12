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
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './',
    }
    return config
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/reference-data',
        permanent: false,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'https://worcoor-backend.onrender.com'
          }/api/:path*`,
      },
      {
        source: '/reference-data/:path*',
        destination: '/dashboard/reference-data/:path*',
      },
      {
        source: '/warehouse-management/:path*',
        destination: '/dashboard/warehouse-management/:path*',
      },
    ]
  },
}

export default nextConfig
