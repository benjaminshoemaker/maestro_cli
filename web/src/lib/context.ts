export function estimateTokens(text: string) {
  if (!text) return 0;
  // Rough approximation: ~4 characters per token for English prose.
  return Math.ceil(text.length / 4);
}

function truncateFromStart(text: string, maxTokens: number) {
  const maxChars = Math.max(0, maxTokens) * 4;
  if (!text || maxChars === 0) {
    return { text: "", truncated: Boolean(text) };
  }

  if (text.length <= maxChars) {
    return { text, truncated: false };
  }

  return {
    text: `[Earlier content truncated for context]\n\n${text.slice(-maxChars)}`,
    truncated: true,
  };
}

type PreviousDoc = {
  phase: number;
  document: string;
};

type BuildPreviousDocsContextParams = {
  currentPhase: 1 | 2 | 3 | 4;
  docs: PreviousDoc[];
  tokenLimit?: number;
};

export function buildPreviousDocsContext({
  currentPhase,
  docs,
  tokenLimit = 15_000,
}: BuildPreviousDocsContextParams) {
  const previousDocs = docs
    .filter((doc) => doc.phase < currentPhase && doc.document)
    .sort((a, b) => a.phase - b.phase);

  if (!previousDocs.length) {
    return { systemMessage: "", wasTruncated: false };
  }

  const header = `## Previous Phase Documents (Context)\n\nUse these as context for this phase. The user may refer back to them.`;
  const sections: string[] = [header];

  let remainingTokens = tokenLimit - estimateTokens(header);
  let wasTruncated = false;

  const mostRecent = previousDocs[previousDocs.length - 1]!;
  const older = previousDocs.slice(0, -1).reverse();

  function renderDocSection(phase: number, document: string) {
    return `### Phase ${phase} Document\n\n${document}`;
  }

  // Always include the most recent doc in full if possible; if it's too large, truncate it.
  {
    const docHeaderTokens = estimateTokens(`### Phase ${mostRecent.phase} Document\n\n`);
    const maxDocTokens = Math.max(0, remainingTokens - docHeaderTokens);
    const truncated = truncateFromStart(mostRecent.document, maxDocTokens);
    if (truncated.truncated) wasTruncated = true;

    const section = renderDocSection(mostRecent.phase, truncated.text);
    sections.push(section);
    remainingTokens -= estimateTokens(section);
  }

  for (const doc of older) {
    if (remainingTokens <= 0) break;

    const docHeaderTokens = estimateTokens(`### Phase ${doc.phase} Document\n\n`);
    const maxDocTokens = Math.max(0, remainingTokens - docHeaderTokens);
    if (maxDocTokens <= 0) break;

    const truncated = truncateFromStart(doc.document, maxDocTokens);
    if (truncated.truncated) wasTruncated = true;

    const section = renderDocSection(doc.phase, truncated.text);
    sections.splice(1, 0, section);
    remainingTokens -= estimateTokens(section);

    // If we had to truncate this doc, older ones would be even less relevant and won't fit.
    if (truncated.truncated) break;
  }

  return {
    systemMessage: sections.join("\n\n---\n\n"),
    wasTruncated,
  };
}

