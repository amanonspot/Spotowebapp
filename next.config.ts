import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    devIndicators: {
        buildActivity: false,
        buildActivityPosition: 'bottom-right',
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'images.pexels.com',
            },
            {
                protocol: 'https',
                hostname: 'spoto-backend-server-api.com',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
            {
                protocol: 'https',
                hostname: '**', // Allow all HTTPS domains for API images
            }
        ],
        // Keep domains for backward compatibility
        domains: ["images.unsplash.com", "images.pexels.com", "spoto-backend-server-api.com"],
    },
};

export default nextConfig;
