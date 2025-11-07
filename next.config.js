/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false, // disable turbopack completely
  },
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;