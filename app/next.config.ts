import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // This project lives in a subfolder of a larger repo (Anchor/backend at the
    // root). Pin Turbopack's root to this app dir so it doesn't infer the repo
    // root from the sibling yarn.lock.
    root: __dirname,
  },
};

export default nextConfig;
