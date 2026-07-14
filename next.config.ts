import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      // Clean URLs → single src/app/page.tsx route (which reads `p` + `slug`
      // from searchParams). The browser address bar keeps the clean path.
      { source: "/about", destination: "/?p=about" },
      { source: "/admin", destination: "/?p=admin" },
      { source: "/article/:slug", destination: "/?p=article&slug=:slug" },
    ];
  },
};

export default nextConfig;
