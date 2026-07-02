import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Use local filesystem for build output to avoid Turbopack SST cache failures
  // on iCloud paths with Korean characters (only for local development)
  distDir: process.env.NODE_ENV === "production" ? ".next" : path.join("/tmp", "didimzip-admin-next"),
};

export default nextConfig;
