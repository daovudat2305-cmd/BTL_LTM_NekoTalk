import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**", // Cho phép tất cả các đường dẫn ảnh trên Cloudinary
      },
    ],
  },
};

export default nextConfig;
