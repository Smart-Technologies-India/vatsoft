/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  env: {
    DATABASE_KEY: process.env.DATABASE_KEY,
    DATABASE_IV: process.env.DATABASE_IV,
  },
};

export default nextConfig;
