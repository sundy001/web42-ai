import { NextRequest, NextResponse } from "next/server";

const CORE_API_URL = process.env.CORE_API_URL || "http://localhost:3002";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward the login request to the core API
    const response = await fetch(`${CORE_API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Authentication failed" },
        { status: response.status },
      );
    }

    // Check if user has admin role
    if (data.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 },
      );
    }

    // Create response with secure httpOnly cookie for session
    const nextResponse = NextResponse.json(
      {
        user: data.user,
        message: "Login successful",
      },
      { status: 200 },
    );

    // Set secure session cookie
    if (data.session?.access_token) {
      nextResponse.cookies.set("admin_session", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: data.session.expires_in || 3600, // 1 hour default
        path: "/",
      });
    }

    return nextResponse;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
