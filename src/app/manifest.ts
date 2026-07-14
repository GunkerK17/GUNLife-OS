import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GunLifeOS — Personal Life Operating System",
    short_name: "GunLifeOS",
    description: "Track your timeline, health, goals, money and daily progress.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#020817",
    theme_color: "#020817",
    orientation: "portrait-primary",
    categories: ["health", "lifestyle", "productivity"],
    icons: [
      {
        src: "/icons/lifeos.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/lifeos-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
