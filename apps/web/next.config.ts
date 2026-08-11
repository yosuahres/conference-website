import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@shared/ui"],
  serverExternalPackages: ["postgres"],
  experimental: {
    serverActions: {
      // Manuscript uploads go through presigned S3 URLs, but abstract text and
      // camera-ready metadata still travel through actions.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
