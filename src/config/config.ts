import { getApiBaseUrl, getPublicSiteUrl } from "@/lib/runtime/publicEnv";

const config = {
    // Backend API URL (canonical; matches `src/lib/api/client.ts`)
    baseUrl: getApiBaseUrl(),

    // Google Maps API Key - must be explicitly provided via environment variable
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",

    // Google Places API Key (for location autocomplete)
    googlePlacesApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "",

    // Payment Configuration
    paymentClientId: process.env.NEXT_PUBLIC_PAYMENT_CLIENT_ID || "spoto",

    // Environment
    env: process.env.NEXT_PUBLIC_ENV || "production",

    // Public site URL (canonical)
    frontendUrl: getPublicSiteUrl(),
};

export default config;
