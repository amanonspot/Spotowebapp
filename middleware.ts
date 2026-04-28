import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = [
    "/auth/login",
    "/auth/otp",
    "/privacy-policy",
    "/terms-of-service",
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the user is authenticated via cookie
    const isAuthenticated = request.cookies.get("auth-token");

    // Check if the current route is public
    const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // If not authenticated and trying to access a protected route
    if (!isAuthenticated && !isPublicRoute) {
        const url = new URL("/auth/login", request.url);
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    // If authenticated and trying to access login page, redirect to home
    if (isAuthenticated && pathname === "/auth/login") {
        const redirect = request.nextUrl.searchParams.get("redirect");

        // Prevent open redirect — only allow relative paths
        const safePath =
            redirect && redirect.startsWith("/") && !redirect.startsWith("//")
                ? redirect
                : "/";

        return NextResponse.redirect(new URL(safePath, request.url));
    }

    return NextResponse.next();
}

// Configure which routes should run the middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - assets, icons, logos, images (public static assets)
         * - sitemap.xml, robots.txt
         */
        "/((?!api|_next/static|_next/image|favicon.ico|assets|icons|logos|images|sitemap|robots).*)",
    ],
};
