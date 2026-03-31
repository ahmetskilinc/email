import { config as loadDotenv } from 'dotenv';
import type { NextConfig } from 'next';

loadDotenv({ path: '../../.env' });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
