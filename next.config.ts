import type { NextConfig } from "next";

// Use a plain object here to allow properties that may not be present
// on the NextConfig type for the installed Next.js version.
const nextConfig = {
  // Ignora erros de linting durante o deploy
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignora erros de tipagem do TypeScript durante o deploy
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;