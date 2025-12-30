type UserMessageProps = {
  content: string;
};

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[min(36rem,100%)] whitespace-pre-wrap rounded-2xl bg-neutral-900 px-4 py-3 text-sm leading-relaxed text-white"
        data-testid="user-message"
      >
        {content}
      </div>
    </div>
  );
}

