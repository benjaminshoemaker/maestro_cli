import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AssistantMessageProps = {
  content: string;
};

export function AssistantMessage({ content }: AssistantMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[min(36rem,100%)] rounded-2xl bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-900">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

