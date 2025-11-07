/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  webpack(config) {
    return config;
  },
};

module.exports = nextConfig;