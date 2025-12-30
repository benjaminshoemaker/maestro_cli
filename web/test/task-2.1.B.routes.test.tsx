import { render, screen } from "@testing-library/react";

import LoginPage from "../app/login/page";
import PricingPage from "../app/pricing/page";
import SessionNewPage from "../app/session/new/page";
import SessionPage from "../app/session/[id]/page";
import SessionPhasePage from "../app/session/[id]/phase/[phase]/page";

describe("Task 2.1.B: basic page routes", () => {
  test("/login renders placeholder", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });

  test("/pricing renders placeholder", () => {
    render(<PricingPage />);
    expect(
      screen.getByRole("heading", { name: /pricing/i }),
    ).toBeInTheDocument();
  });

  test("/session/new renders placeholder", () => {
    render(<SessionNewPage />);
    expect(
      screen.getByRole("heading", { name: /new session/i }),
    ).toBeInTheDocument();
  });

  test("/session/[id] renders placeholder", () => {
    render(<SessionPage params={{ id: "test-session" }} />);
    expect(
      screen.getByRole("heading", { name: /session: test-session/i }),
    ).toBeInTheDocument();
  });

  test("/session/[id]/phase/[phase] renders placeholder", () => {
    render(<SessionPhasePage params={{ id: "test-session", phase: "2" }} />);
    expect(
      screen.getByRole("heading", { name: /phase 2/i }),
    ).toBeInTheDocument();
  });
});

