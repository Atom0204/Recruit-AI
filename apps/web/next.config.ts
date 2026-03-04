import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  transpilePackages: [
    "@recruitai/shared",
    "@recruitai/ai-service",
    "@recruitai/proctoring-service"
  ],
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
