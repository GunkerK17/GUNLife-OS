import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "GunLifeOS",
    short_name: "GunLifeOS",
    description: "Personal life operating system for health, goals, skills and finance.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#020817",
    theme_color: "#020817",
    orientation: "portrait-primary",
    categories: ["health", "lifestyle", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        purpose: "any",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        purpose: "maskable",
        type: "image/png",
      },
    ],
  };
}
