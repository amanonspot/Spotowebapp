const config = {
    // Backend API URL - Use production URL
    baseUrl:
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "https://production.api.spoto.in",
    
    // Google Maps API Key - must be explicitly provided via environment variable
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    
    // Google Places API Key (for location autocomplete)
    googlePlacesApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "",
    
    // Payment Configuration
    paymentClientId: process.env.NEXT_PUBLIC_PAYMENT_CLIENT_ID || 'spoto',
    
    // Environment
    env: process.env.NEXT_PUBLIC_ENV || 'production',
    
    // Frontend URL - Use production URL
    frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || "https://spoto.in",
};

export default config;
