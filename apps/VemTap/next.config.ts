import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: false, // Enabled in dev so we can test offline caching
});

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // output: "standalone",
  /* config options here */
  turbopack: {
    root: process.cwd(),
  },
};

export default withSerwist(nextConfig);
