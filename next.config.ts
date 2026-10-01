import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Inlined into client bundles too, so date-formatters render in the same
    // single display zone on the server and in the browser.
    CLINIC_TIMEZONE: process.env.CLINIC_TIMEZONE?.trim() || "America/New_York",
  },
};

export default nextConfig;
