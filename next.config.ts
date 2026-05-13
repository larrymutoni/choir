import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: process.env.NODE_ENV === "production",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
