import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  webpack: (config) => {
    config.externals.push("pino-pretty", "encoding");
    return config;
  },
};

export default nextConfig;
