import withSerwistInit from "@serwist/next";

const isDev = process.env.NODE_ENV === "development";
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Avoid SW interference in development
  disable: isDev,
  register: !isDev,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
    ],
  },
  webpack: (config) => {
    // react-pdf requires canvas on server side, exclude it
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default withSerwist(nextConfig);
