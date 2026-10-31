export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex justify-start px-1 py-1" aria-live="polite">
      <div className="rounded-[18px] rounded-bl-md bg-background px-3.5 py-2.5 shadow-[var(--shadow-subtle)]">
        <p className="sr-only">{name} is typing</p>
        <div className="flex items-center gap-1">
          <span className="typing-dot size-1.5 rounded-full bg-text-muted" />
          <span className="typing-dot size-1.5 rounded-full bg-text-muted [animation-delay:120ms]" />
          <span className="typing-dot size-1.5 rounded-full bg-text-muted [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}
