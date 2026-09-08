import { ArrowRight, Bot } from "lucide-react";

export function CareerMinebotCard() {
  return <section className="rounded-2xl border border-brand-cyan/25 bg-surface p-5">
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/5 text-brand-cyan"><Bot className="size-5" aria-hidden="true" /></span>
      <div><h2 className="text-lg leading-7">Punya pertanyaan tentang Karier?</h2>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">MineBot akan membantu menelusuri materi karier setelah basis pengetahuannya siap.</p>
      </div>
    </div>
    <button type="button" disabled className="mt-4 flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border border-border bg-muted/40 px-4 text-sm text-muted-foreground">Segera hadir<ArrowRight className="size-4" aria-hidden="true" /></button>
  </section>;
}
