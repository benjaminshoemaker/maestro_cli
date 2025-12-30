export type LocalhostSavePayload = {
  phase: 1 | 2 | 3 | 4;
  filename: string;
  content: string;
};

export type LocalhostSaveResult = {
  success: true;
  path: string;
};

export function getLocalhostSaveUrl(port: number) {
  return `http://localhost:${port}/save`;
}

export async function postDocumentToLocalhost(params: {
  port: number;
  sessionToken: string;
  payload: LocalhostSavePayload;
  timeoutMs?: number;
}): Promise<LocalhostSaveResult> {
  const timeoutMs = params.timeoutMs ?? 5_000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(getLocalhostSaveUrl(params.port), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${params.sessionToken}`,
      },
      body: JSON.stringify(params.payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body: any = await response.json().catch(() => null);
      throw new Error(body?.error ?? `Localhost callback failed with status ${response.status}`);
    }

    const body = (await response.json()) as Partial<LocalhostSaveResult> | null;
    if (!body?.success || typeof body.path !== "string") {
      throw new Error("Invalid localhost callback response");
    }

    return { success: true, path: body.path };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Localhost callback timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

