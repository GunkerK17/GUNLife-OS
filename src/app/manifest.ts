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
        src: "/brand/gunlifeos-brand.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
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
