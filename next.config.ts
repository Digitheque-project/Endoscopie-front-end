import type { NextConfig } from "next";

const backendUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  process.env.API_URL ||
  "http://127.0.0.1:3333";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Sortie autonome (server.js + node_modules minimaux) pour une image Docker légère —
  // voir Dockerfile, qui seul positionne DOCKER_BUILD. Render déploie avec `next start`
  // (voir render.yaml), qui affiche un avertissement et ne fonctionne pas correctement
  // avec `output: "standalone"` — ce mode ne doit donc s'activer que pour Docker.
  ...(process.env.DOCKER_BUILD ? { output: "standalone" as const } : {}),
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
