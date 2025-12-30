/**
 * @jest-environment node
 */

import { GET } from "../app/api/auth/github/redirect/route";

describe("Task 2.3.A OAuth redirect", () => {
  test("redirects to GitHub OAuth with state cookie", async () => {
    const request = new Request("http://localhost:3000/api/auth/github/redirect");
    const response = await GET(request);

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);

    const location = response.headers.get("location");
    expect(location).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize\?/);

    const url = new URL(location!);
    expect(url.searchParams.get("client_id")).toBeTruthy();
    expect(url.searchParams.get("scope")).toContain("user:email");
    expect(url.searchParams.get("redirect_uri")).toMatch(/\/api\/auth\/github$/);
    expect(url.searchParams.get("state")).toBeTruthy();

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("maestro_oauth_state=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toMatch(/SameSite=Lax/i);
  });
});

