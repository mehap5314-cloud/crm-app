/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['googleapis', 'better-sqlite3'],
  },
}

module.exports = nextConfig
