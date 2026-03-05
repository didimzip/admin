import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use local filesystem for build output to avoid Turbopack SST cache failures
  // on iCloud paths with Korean characters
  distDir: "/tmp/didimzip-admin-next",
};

export default nextConfig;
