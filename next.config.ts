import type { NextConfig } from "next";

const backendUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  process.env.API_URL ||
  "http://127.0.0.1:3333";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Sortie autonome (server.js + node_modules minimaux) pour une image Docker légère —
  // voir Dockerfile.
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  experimental: {
    cpus: 1,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
