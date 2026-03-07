import type { MetadataRoute } from "next";

const APP_NAME = "Biru Coffee";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Biru Coffee",
    short_name: "Biru",
    description: APP_NAME,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eceff1",
    theme_color: "#607d8b",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
