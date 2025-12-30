"use client";

import { useState } from "react";

import { ConfirmDialog } from "./ConfirmDialog";

type DoneButtonProps = {
  onConfirm: () => void;
  isGenerating?: boolean;
};

export function DoneButton({ onConfirm, isGenerating }: DoneButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isDisabled = Boolean(isGenerating);

  return (
    <>
      <button
        type="button"
        className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
        onClick={() => setConfirmOpen(true)}
        disabled={isDisabled}
        data-testid="done-button"
      >
        {isGenerating ? "Generating…" : "Done"}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Complete this phase?"
        description="This will generate the document and move you to the next phase."
        confirmLabel="Complete phase"
        cancelLabel="Cancel"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onConfirm();
        }}
      />
    </>
  );
}

