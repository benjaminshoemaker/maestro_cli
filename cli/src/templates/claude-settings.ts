export function claudeSettingsTemplate(): string {
  return JSON.stringify(
    {
      enabledPlugins: {
        "frontend-design@claude-code-plugins": true,
      },
      alwaysThinkingEnabled: true,
    },
    null,
    2,
  );
}

