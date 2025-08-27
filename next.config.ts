import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        port: "",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        port: "",
      },
    ],
  },
  experimental: {
   // serverActions: false, // ✅ Disable validator
  },
  async rewrites() {
    return [
      {
        source: "/_next/:path*",
        destination: "/_next/:path*",
      },
    ];
  },
};

export default nextConfig;
