import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let imageRemotePatterns: NextConfig["images"] = undefined;

try {
  const apiHost = new URL(apiUrl);
  imageRemotePatterns = {
    remotePatterns: [
      {
        protocol: apiHost.protocol.replace(":", "") as "http" | "https",
        hostname: apiHost.hostname,
        port: apiHost.port,
        pathname: "/image/**",
      },
    ],
  };
} catch {
  imageRemotePatterns = undefined;
}

const nextConfig: NextConfig = {
  // Allow other PCs on the LAN to access Next.js dev resources
  allowedDevOrigins: ["172.31.61.97"],

  ...(imageRemotePatterns ? { images: imageRemotePatterns } : {}),

  async rewrites() {
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