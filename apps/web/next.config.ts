import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  transpilePackages: [
    "@recruitai/shared",
    "@recruitai/ai-service",
    "@recruitai/db-service",
    "@recruitai/proctoring-service"
  ]
};

export default nextConfig;
