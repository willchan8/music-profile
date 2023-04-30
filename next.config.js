/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    JWT_SECRET: "your-jwt-secret-here",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
    ],
  },
  async headers() {
    return [
      {
        // Set the Access-Control-Expose-Headers header to allow the client to read the 'Authorization' header in the response
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Expose-Headers",
            value: "Authorization",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
