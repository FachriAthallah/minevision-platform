import {
  BriefcaseBusiness,
  Camera,
  Code2,
  ExternalLink,
  GitBranch,
  Phone,
} from "lucide-react";

import { developerProfile } from "./resource-content";

const socialIcons = {
  github: GitBranch,
  linkedin: BriefcaseBusiness,
  instagram: Camera,
} as const;

export function DeveloperContactCard() {
  return (
    <section
      aria-labelledby="developer-name"
      className="relative isolate overflow-hidden rounded-[2rem] border border-brand-cyan/20 bg-[#07182c] px-5 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:px-10 sm:py-12"
    >
      <div aria-hidden="true" className="absolute -left-20 -top-24 -z-10 size-64 rounded-full bg-brand-blue/15 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-28 -right-16 -z-10 size-72 rounded-full bg-brand-teal/10 blur-3xl" />

      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-cyan/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">
          <Code2 aria-hidden="true" className="size-4" />
          Developed by
        </span>
        <h2 id="developer-name" className="mt-5 text-3xl leading-tight text-white sm:text-4xl">
          {developerProfile.name}
        </h2>
        <p className="mt-3 text-sm font-bold uppercase tracking-[0.12em] text-brand-teal">
          {developerProfile.role}
        </p>
        <a
          href={developerProfile.phone.href}
          aria-label={`Hubungi ${developerProfile.name} di ${developerProfile.phone.label}`}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-5 text-sm font-semibold text-[#d5dfeb] transition-colors hover:border-brand-cyan/45 hover:bg-brand-cyan/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
        >
          <Phone aria-hidden="true" className="size-4 text-brand-cyan" />
          {developerProfile.phone.label}
        </a>
      </div>

      <nav aria-label="Media sosial pengembang" className="mx-auto mt-9 grid max-w-4xl gap-3 sm:grid-cols-3">
        {developerProfile.socialLinks.map((item) => {
          const Icon = socialIcons[item.id];

          return (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Buka ${item.label} ${developerProfile.name} di tab baru`}
              className="group flex min-w-0 items-center gap-4 rounded-2xl border border-white/10 bg-[#061225]/80 p-4 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-brand-cyan/40 hover:bg-brand-cyan/[0.07] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-cyan motion-reduce:transform-none"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 text-brand-cyan">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-white">{item.label}</span>
                <span className="mt-1 block truncate text-xs text-[#8fa0b4]">{item.value}</span>
              </span>
              <ExternalLink aria-hidden="true" className="size-4 shrink-0 text-[#65768a] transition-colors group-hover:text-brand-cyan" />
            </a>
          );
        })}
      </nav>

      <p className="mt-9 text-center text-xs leading-6 text-[#74859a]">
        © 2026 {developerProfile.name}. MineVision.
      </p>
    </section>
  );
}
