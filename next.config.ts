import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cursor port-forward / Simple Browser hosts in dev
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
