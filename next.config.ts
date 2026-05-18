import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [25, 75],

    unoptimized: true,
  },
};

export default nextConfig;
