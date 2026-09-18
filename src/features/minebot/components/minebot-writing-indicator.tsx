/**
 * MineBot writing identity: exactly five dots sweeping in a staggered vertical
 * "roller coaster" wave. Shown only while MineBot is preparing the response;
 * it disappears once the first streamed character renders.
 */
export function MineBotWritingIndicator() {
  return (
    <div className="flex items-center gap-1.5" role="status" aria-live="polite">
      <span className="sr-only">MineBot sedang mengetik jawaban</span>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="minebot-dot"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </div>
  );
}