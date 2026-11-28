import type { MetadataRoute } from "next";

// Lets people add The Game to their phone's home screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Game",
    short_name: "The Game",
    description: "A birthday gift with a twist.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0a09",
    theme_color: "#0b0a09",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
