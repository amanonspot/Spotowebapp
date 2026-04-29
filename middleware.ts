import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/otp",
    "/search",
    "/booking",
    "/privacy-policy",
    "/terms-of-service",
];

// Routes that ALWAYS require authentication (even if prefix matches a public route)
const protectedRoutes = [
    "/owner",
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the user is authenticated via cookie
    const isAuthenticated = request.cookies.get("auth-token");

    // Protected routes always require auth
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // Check if the current route is public
    const isPublicRoute = !isProtectedRoute && publicRoutes.some((route) =>
        pathname === route || pathname.startsWith(route + "/") || pathname.startsWith(route + "?")
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
