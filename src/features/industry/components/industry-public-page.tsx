import { Container } from "@/components/ui/container";
import type { PublicIndustryExperience } from "@/features/industry/server/get-public-industry-experience";
import type { IndustryCategory } from "@/features/industry/types/industry-view";

import { IndustryCategoryNavigation } from "./industry-category-navigation";
import { IndustryExplorer } from "./industry-explorer";
import { IndustryHero } from "./industry-hero";
import { IndustryTrustedSources } from "./industry-trusted-sources";

type IndustryPublicPageProps = {
  activeCategory: IndustryCategory;
  experience: PublicIndustryExperience;
  dataError: boolean;
};

export function IndustryPublicPage({
  activeCategory,
  experience,
  dataError,
}: IndustryPublicPageProps) {
  return (
    <div className="bg-background">
      <IndustryHero
        companies={experience.companies}
        operationSites={experience.operationSites}
        dataError={dataError}
      />

      <section className="relative py-12 sm:py-16 lg:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(40,103,228,0.07),transparent_26%),radial-gradient(circle_at_90%_40%,rgba(60,195,171,0.05),transparent_28%)]"
        />
        <Container className="relative max-w-[1320px]">
          <IndustryCategoryNavigation activeCategory={activeCategory} />

          <div className="mt-10 rounded-3xl border border-border bg-background/45 p-5 shadow-[0_20px_58px_rgba(0,0,0,0.18)] sm:p-7 lg:mt-12 lg:p-9">
            <IndustryExplorer
              key={activeCategory}
              category={activeCategory}
              companies={experience.companies}
              reports={experience.reports}
              operationSites={experience.operationSites}
              dataError={dataError}
            />
          </div>

          <IndustryTrustedSources
            activeCategory={activeCategory}
            companies={experience.companies}
            operationSites={experience.operationSites}
          />
        </Container>
      </section>
    </div>
  );
}
