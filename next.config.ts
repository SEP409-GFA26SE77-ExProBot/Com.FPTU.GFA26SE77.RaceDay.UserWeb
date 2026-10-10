import type { NextConfig } from "next";

type ImageRemotePattern = {
  protocol?: "http" | "https";
  hostname: string;
  port?: string;
  pathname?: string;
};

/** Banner/upload từ API (vd. localhost:5080/event-docs/…) */
function apiImageRemotePatterns(): ImageRemotePattern[] {
  const patterns: ImageRemotePattern[] = [
    { protocol: "http", hostname: "localhost", pathname: "/**" },
    { protocol: "http", hostname: "localhost", port: "5080", pathname: "/**" },
    { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
    { protocol: "http", hostname: "127.0.0.1", port: "5080", pathname: "/**" },
  ];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const u = new URL(apiUrl);
      const protocol = u.protocol.replace(":", "") as "http" | "https";
      if (protocol === "http" || protocol === "https") {
        patterns.push({
          protocol,
          hostname: u.hostname,
          ...(u.port ? { port: u.port } : {}),
          pathname: "/**",
        });
      }
    } catch {
      /* ignore bad env */
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      ...apiImageRemotePatterns(),
    ],
  },
};

export default nextConfig;
