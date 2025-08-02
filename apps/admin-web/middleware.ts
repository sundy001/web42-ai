import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "./lib/api/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to login page and static assets
  if (
    pathname === "/login" ||
    pathname === "/" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  try {
    await getCurrentUser();
    return NextResponse.next();
  } catch (error) {
    // Redirect to login if authentication fails
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
