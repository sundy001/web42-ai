import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Create response
    const response = NextResponse.json(
      { message: "Logout successful" },
      { status: 200 },
    );

    // Clear the admin session cookie
    response.cookies.set("admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
