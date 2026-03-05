import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VemTap",
    short_name: "VemTap",
    description: "VemTap - The Ultimate Business Loyalty and Engagement Platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/VEMTAP_TITLE.png",
        sizes: "any",
        type: "image/png",
      },
      {
        src: "/VEMTAP_TITLE.png",
        sizes: "any",
        type: "image/png",
      },
      {
        src: "/VEMTAP_TITLE.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
