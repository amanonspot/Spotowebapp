import type { NextConfig } from "next";
import { getApiBaseUrl } from "./src/lib/runtime/publicEnv";

const isProduction = process.env.NODE_ENV === "production";
const apiBaseUrl = getApiBaseUrl();

const connectSrcHosts = [
    "'self'",
    "https://production.api.spoto.in",
    "https://api.spoto.in",
    "https://maps.googleapis.com",
    "https://maps.gstatic.com",
    "https://checkout.razorpay.com",
    "https://api.razorpay.com",
    "https://lumberjack.razorpay.com",
];

const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isProduction ? [] : ["'unsafe-eval'"]),
    "https://maps.googleapis.com",
    "https://maps.gstatic.com",
    "https://checkout.razorpay.com",
].join(" ");

try {
    const parsedUrl = new URL(apiBaseUrl);
    connectSrcHosts.push(parsedUrl.origin);
} catch {
    // Ignore malformed runtime base URL and keep defaults
}

const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    `connect-src ${Array.from(new Set(connectSrcHosts)).join(" ")}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://razorpay.com https://maps.google.com https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
    output: "standalone",
    reactStrictMode: true,
    poweredByHeader: false,
    productionBrowserSourceMaps: false,
    compiler: {
        removeConsole: isProduction,
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
            ...(!isProduction
                ? [
                    {
                        protocol: 'http' as const,
                        hostname: 'localhost',
                    },
                ]
                : []),
        ],
        // Keep domains for backward compatibility
        domains: ["images.unsplash.com", "images.pexels.com", "spoto-backend-server-api.com"],
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: contentSecurityPolicy,
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
