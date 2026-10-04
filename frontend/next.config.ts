import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, ".."),
  distDir: process.env.LABORA_DIST_DIR || ".next",
};

export default config;
