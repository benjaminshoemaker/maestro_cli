import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AssistantMessageProps = {
  content: string;
  timestamp?: string;
};

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function AssistantMessage({ content, timestamp }: AssistantMessageProps) {
  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-light">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-accent"
          aria-hidden="true"
        >
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
      </div>

      <div className="flex flex-col gap-1">
        <div className="message-assistant prose prose-sm prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Customize code blocks
              pre: ({ children }) => (
                <pre className="overflow-x-auto rounded-lg bg-surface-tertiary p-3 text-xs">
                  {children}
                </pre>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="rounded bg-surface-tertiary px-1 py-0.5 text-xs">
                    {children}
                  </code>
                ) : (
                  <code className={className}>{children}</code>
                );
              },
              // Customize links
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-accent underline underline-offset-2 hover:text-accent-hover"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              // Customize lists
              ul: ({ children }) => (
                <ul className="list-disc space-y-1 pl-4">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal space-y-1 pl-4">{children}</ol>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {timestamp ? (
          <span className="px-1 text-[10px] text-muted">{formatTime(timestamp)}</span>
        ) : null}
      </div>
    </div>
  );
}
