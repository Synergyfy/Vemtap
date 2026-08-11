import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: false,
});

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  turbopack: {},
};

export default withSerwist(nextConfig);
