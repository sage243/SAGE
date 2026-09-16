import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  // Cursor cloud / desktop port-forward hosts hit the dev server cross-origin.
  // Without these entries Next blocks /_next/* and RSC fetches → "Failed to fetch".
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.localhost",
    "**.localhost",
    "*.cursor.sh",
    "**.cursor.sh",
    "*.cursor.com",
    "**.cursor.com",
    "*.cursorusercontent.com",
    "**.cursorusercontent.com",
    "*.cursorproxy.com",
    "**.cursorproxy.com",
  ],
};

export default nextConfig;
