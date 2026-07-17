/** @type {import('next').NextConfig} */
const nextConfig = {
  // API routes with DB access must stay dynamic
  output: undefined,
  serverExternalPackages: ['googleapis'],
}

module.exports = nextConfig
