import type { NextConfig } from "next";
import path from "path";
import CopyPlugin from "copy-webpack-plugin";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: "node_modules/leaflet/dist/images",
            to: path.resolve(__dirname, "public", "leaflet", "images"),
          },
        ],
      })
    );
    return config;
  },
};

export default nextConfig;
