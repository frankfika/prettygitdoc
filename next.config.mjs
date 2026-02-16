import withSerwistInit from "@serwist/next";

const isDev = process.env.NODE_ENV === "development";
const basePath = isDev ? "" : "/prettygitdoc";
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Avoid SW interference in development
  disable: isDev,
  register: false,
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
  ...(basePath ? { basePath } : {}),
  publicRuntimeConfig: {
    BASE_PATH: basePath,
  },
  webpack: (config) => {
    // react-pdf requires canvas on server side, exclude it
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default withSerwist(nextConfig);
