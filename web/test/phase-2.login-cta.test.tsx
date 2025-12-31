import { render, screen } from "@testing-library/react";

import LoginPage from "../app/login/page";

describe("Phase 2 checkpoint: login CTA", () => {
  test("login page links to GitHub OAuth redirect", () => {
    render(<LoginPage />);
    const cta = screen.getByRole("link", { name: /continue with github/i });
    expect(cta).toHaveAttribute("href", "/api/auth/github/redirect");
  });

  test("login page preserves ?next= in OAuth redirect link", () => {
    render(<LoginPage searchParams={{ next: "/session/new?callback=localhost:1&token=x&project=y" }} />);
    const cta = screen.getByRole("link", { name: /continue with github/i });
    expect(cta.getAttribute("href")).toContain("/api/auth/github/redirect?next=");
    expect(decodeURIComponent(cta.getAttribute("href")!)).toContain(
      "next=/session/new?callback=localhost:1&token=x&project=y",
    );
  });
});
