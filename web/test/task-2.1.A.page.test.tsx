import { render, screen } from "@testing-library/react";

import HomePage from "../app/page";

describe("HomePage", () => {
  it("renders a placeholder landing page", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Maestro" })).toBeVisible();
    expect(
      screen.getByText(/Placeholder landing page/i),
    ).toBeInTheDocument();
  });
});

