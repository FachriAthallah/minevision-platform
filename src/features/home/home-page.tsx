import { HeroSection } from "./components/hero-section";
import { IntelligencePreviewSection } from "./components/intelligence-preview-section";
import { OverviewSection } from "./components/overview-section";
import { SearchResourcesSection } from "./components/search-resources-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <OverviewSection />
      <IntelligencePreviewSection />
      <SearchResourcesSection />
    </>
  );
}