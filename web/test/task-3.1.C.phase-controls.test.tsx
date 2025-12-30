import { fireEvent, render, screen, within } from "@testing-library/react";

import { DoneButton } from "../src/components/chat/DoneButton";
import { PhaseIndicator } from "../src/components/chat/PhaseIndicator";

describe("Task 3.1.C phase indicator + done button", () => {
  test("PhaseIndicator shows current phase number and name", () => {
    render(<PhaseIndicator currentPhase={2} completedPhases={[1]} />);

    const current = screen.getByTestId("phase-indicator-current");
    expect(current).toHaveTextContent("Phase 2");
    expect(current).toHaveTextContent("Technical Spec");
  });

  test("PhaseIndicator uses the expected phase names", () => {
    render(<PhaseIndicator currentPhase={4} completedPhases={[1, 2, 3]} />);

    expect(within(screen.getByTestId("phase-step-1")).getByText("Product Spec")).toBeInTheDocument();
    expect(within(screen.getByTestId("phase-step-2")).getByText("Technical Spec")).toBeInTheDocument();
    expect(within(screen.getByTestId("phase-step-3")).getByText("Implementation Plan")).toBeInTheDocument();
    expect(within(screen.getByTestId("phase-step-4")).getByText("AGENTS.md")).toBeInTheDocument();
  });

  test("PhaseIndicator progress indicator shows completed phases", () => {
    render(<PhaseIndicator currentPhase={3} completedPhases={[1, 2]} />);

    expect(screen.getByTestId("phase-step-1")).toHaveAttribute("data-state", "complete");
    expect(screen.getByTestId("phase-step-2")).toHaveAttribute("data-state", "complete");
    expect(screen.getByTestId("phase-step-3")).toHaveAttribute("data-state", "current");
    expect(screen.getByTestId("phase-step-4")).toHaveAttribute("data-state", "upcoming");
  });

  test("DoneButton is disabled during document generation", () => {
    render(<DoneButton onConfirm={jest.fn()} isGenerating />);
    expect(screen.getByTestId("done-button")).toBeDisabled();
  });

  test("DoneButton requires confirmation before completing phase", () => {
    const onConfirm = jest.fn();
    render(<DoneButton onConfirm={onConfirm} />);

    fireEvent.click(screen.getByTestId("done-button"));
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("confirm-dialog-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
