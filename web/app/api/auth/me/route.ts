import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { db } from "../../../../src/db";
import { users } from "../../../../src/db/schema";
import { getAuthCookieName, parseCookieHeader, verifyAuthToken } from "../../../../src/lib/auth";

export async function GET(request: Request) {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const token = cookies[getAuthCookieName()];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await verifyAuthToken(token);

    const [user] = await db
      .select({
        id: users.id,
        githubUsername: users.githubUsername,
        email: users.email,
        subscriptionStatus: users.subscriptionStatus,
        freeProjectUsed: users.freeProjectUsed,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
