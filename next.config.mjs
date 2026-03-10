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
        destination: `${
    process.env.NODE_ENV === 'production' && 
    !process.env.BACKEND_URL
      ? (() => { throw new Error(
          'BACKEND_URL is required in production'
        )})()
      : process.env.BACKEND_URL || 
        'http://localhost:4000'
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
