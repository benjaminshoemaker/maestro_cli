export function maestroConfigTemplate(params: {
  projectName: string;
  sessionToken: string;
  createdAt: string;
}): string {
  return JSON.stringify(
    {
      version: "1.0.0",
      projectName: params.projectName,
      sessionToken: params.sessionToken,
      createdAt: params.createdAt,
    },
    null,
    2,
  );
}

