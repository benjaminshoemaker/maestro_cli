import { NextResponse } from "next/server";

import { getAuthCookieName } from "../../../../src/lib/auth";

export async function POST(_request: Request) {
  const response = NextResponse.json({ success: true }, { status: 200 });

  response.cookies.set(getAuthCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

