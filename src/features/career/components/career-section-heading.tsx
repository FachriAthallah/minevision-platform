import { BookOpen, BriefcaseBusiness, ClipboardList, GraduationCap, Layers3, Monitor, ShieldCheck, Target, type LucideIcon } from "lucide-react";

export const careerSectionIcons: Record<string, LucideIcon> = {
  overview: BookOpen, professions: BriefcaseBusiness, workScope: ClipboardList,
  competency: Target, education: GraduationCap, software: Monitor,
  training: Layers3, references: ShieldCheck,
};

export function CareerSectionHeading({ id, title, section }: { id?: string; title: string; section: string }) {
  const Icon = careerSectionIcons[section] ?? BookOpen;
  return <div className="flex items-center gap-4 border-b border-border pb-6">
    <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/5 text-brand-cyan sm:size-14"><Icon className="size-6" aria-hidden="true" /></span>
    <h2 id={id} className="min-w-0 text-2xl leading-snug sm:text-3xl">{title}</h2>
  </div>;
}
