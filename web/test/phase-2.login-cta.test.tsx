import { render, screen } from "@testing-library/react";

import LoginPage from "../app/login/page";

describe("Phase 2 checkpoint: login CTA", () => {
  test("login page links to GitHub OAuth redirect", () => {
    render(<LoginPage />);
    const cta = screen.getByRole("link", { name: /continue with github/i });
    expect(cta).toHaveAttribute("href", "/api/auth/github/redirect");
  });
});

