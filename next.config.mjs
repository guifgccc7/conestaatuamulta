/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client",
      "bcryptjs",
      "@react-pdf/renderer",
    ],
  },
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};

export default nextConfig;
