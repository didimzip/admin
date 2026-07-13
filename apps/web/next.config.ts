import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@didimzip/api"],
  distDir:
    process.env.NODE_ENV === "production"
      ? ".next"
      : path.join("/tmp", "didimzip-web-next"),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
