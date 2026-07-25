import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const apiHost = new URL(apiUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiHost.protocol.replace(":", "") as "http" | "https",
        hostname: apiHost.hostname,
        port: apiHost.port,
        pathname: "/image/**",
      },
    ],
  },
  async rewrites() {
    // Only proxy in local dev, so production (Vercel) keeps calling
    // the real backend directly and isn't affected by this at all.
    if (process.env.NODE_ENV !== "development") {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: "https://storage.annam.ai/:path*",
      },
    ];
  },
};

export default nextConfig;
