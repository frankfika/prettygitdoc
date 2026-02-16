import withSerwistInit from "@serwist/next";

const isDev = process.env.NODE_ENV === "development";
const isTauri = !!process.env.TAURI_BUILD;
const basePath = isDev || isTauri ? "" : "/prettygitdoc";
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Avoid SW interference in development
  disable: isDev,
  register: false,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
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
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
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
