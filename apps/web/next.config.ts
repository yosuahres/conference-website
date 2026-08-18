import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone: a self-contained server with only the modules the
  // app actually imports. On a 1GB cPanel plan this is the difference between
  // a Node process that fits in the LVE limit and one Passenger keeps killing.
  output: "standalone",
  // pnpm workspace: without this Next traces from apps/web and misses the
  // hoisted node_modules at the repo root, producing a standalone build that
  // crashes on first require.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@shared/ui"],
  serverExternalPackages: ["postgres"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
