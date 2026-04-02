import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // This will immediately drop Vercel invocations by routing legacy traffic to your VPS
    const trackerUrl = process.env.NEXT_PUBLIC_TRACKER_URL;
    if (!trackerUrl) return [];

    return [
      {
        source: '/api/track/impression',
        destination: `${trackerUrl}/impression`,
        permanent: true,
      },
      {
        source: '/api/track/click',
        destination: `${trackerUrl}/click`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
