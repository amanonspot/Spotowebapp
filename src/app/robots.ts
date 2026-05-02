import { MetadataRoute } from 'next';
import { getPublicSiteUrl } from "@/lib/runtime/publicEnv";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = getPublicSiteUrl();
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/auth/', '/profile/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}

