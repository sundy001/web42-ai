import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithTokenRefresh } from "./lib/api/auth";

export async function middleware(request: NextRequest, response: NextResponse) {
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
    // TODO: save user to the request object
    const { user, tokens } = await getCurrentUserWithTokenRefresh(
      request.cookies.get("web42_access_token")?.value ?? "",
      request.cookies.get("web42_refresh_token")?.value,
    );

    const nextResponse = NextResponse.next();
    // set new tokens to the response
    if (tokens) {
      nextResponse.cookies.set("web42_access_token", tokens.accessToken);
      nextResponse.cookies.set("web42_refresh_token", tokens.refreshToken);
    }

    return nextResponse;
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
