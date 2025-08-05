import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "./lib/api/users";

export async function middleware(request: NextRequest, response: NextResponse) {
  const { pathname } = request.nextUrl;
  console.log("pathname", pathname);

  // Allow access to login page and static assets
  if (
    pathname === "/admin/login" ||
    pathname === "/" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    console.log("pass", pathname);
    return NextResponse.next();
  }

  // Check authentication for protected routes
  try {
    const { tokens } = await getCurrentUser();

    const nextResponse = NextResponse.next();
    // set new tokens to the response
    if (tokens) {
      nextResponse.cookies.set("web42_access_token", tokens.accessToken);
      nextResponse.cookies.set("web42_refresh_token", tokens.refreshToken);
    }

    return nextResponse;
  } catch (error) {
    // Redirect to login if authentication fails
    const loginUrl = new URL("/admin/login", request.url);
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
