import { SignJWT, jwtVerify } from "jose";

const AUTH_COOKIE = "maestro_auth";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing required environment variable: JWT_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export function getAuthCookieName() {
  return AUTH_COOKIE;
}

export async function signAuthToken(userId: string) {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    algorithms: ["HS256"],
  });

  const userId = typeof payload.userId === "string" ? payload.userId : null;
  if (!userId) {
    throw new Error("Invalid auth token payload");
  }

  return { userId };
}

export async function getUserIdFromRequest(request: Request) {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const token = cookies[getAuthCookieName()];
  if (!token) return null;

  try {
    const { userId } = await verifyAuthToken(token);
    return userId;
  } catch {
    return null;
  }
}

export function parseCookieHeader(cookieHeader: string | null) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (!name) continue;
    cookies[name] = rest.join("=");
  }

  return cookies;
}
