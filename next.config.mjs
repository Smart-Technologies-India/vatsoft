/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    DATABASE_KEY: process.env.DATABASE_KEY,
    DATABASE_IV: process.env.DATABASE_IV,
  },
};

export default nextConfig;
