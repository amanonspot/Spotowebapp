import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = ["/auth/login"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the user is authenticated
    const isAuthenticated = request.cookies.get("auth-token");

    // Check if the current route is public
    const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // If not authenticated and trying to access a protected route (any route except public routes)
    if (!isAuthenticated && !isPublicRoute) {
        const url = new URL("/auth/login", request.url);
        // Add the original URL as a redirect parameter
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    // If authenticated and trying to access login page, redirect to home
    if (isAuthenticated && pathname === "/auth/login") {
        const redirect = request.nextUrl.searchParams.get("redirect");
        return NextResponse.redirect(new URL(redirect || "/", request.url));
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
         * - public assets
         */
        "/((?!api|_next/static|_next/image|favicon.ico|assets).*)",
    ],
};
