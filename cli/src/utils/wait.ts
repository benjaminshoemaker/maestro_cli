import inquirer from "inquirer";
import ora from "ora";

export type SavedDocument = {
  phase: number;
  filename: string;
  path: string;
};

type WaitForSave = (options: { timeoutMs: number }) => Promise<SavedDocument>;

function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const anyError = error as { code?: unknown; name?: unknown; message?: unknown };

  return (
    anyError.code === "ETIMEOUT" ||
    anyError.name === "TimeoutError" ||
    (typeof anyError.message === "string" && anyError.message.toLowerCase().includes("timeout"))
  );
}

export async function waitForDocument(params: {
  waitForSave: WaitForSave;
  timeoutMs?: number;
}): Promise<SavedDocument> {
  const timeoutMs = params.timeoutMs ?? 5 * 60 * 1000;

  while (true) {
    const spinner = ora("Waiting for document...").start();

    try {
      const saved = await params.waitForSave({ timeoutMs });
      spinner.succeed("Document received");
      return saved;
    } catch (error) {
      if (!isTimeoutError(error)) {
        spinner.fail("Failed while waiting for document");
        throw error;
      }

      spinner.fail("Timed out waiting for document");
      await inquirer.prompt([
        {
          type: "input",
          name: "retry",
          message: "Press Enter to retry waiting for the document (Ctrl+C to exit):",
        },
      ]);
    }
  }
}

