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
        destination: 'http://localhost:4000/api/:path*',
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
