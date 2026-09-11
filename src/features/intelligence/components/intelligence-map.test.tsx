import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { PublicIntelligenceCoverage } from "../types/dashboard";
import { IntelligenceLocationMap } from "./intelligence-map";

const coverage: PublicIntelligenceCoverage = {
  id: "coverage-nikel",
  commoditySlug: "nikel",
  region: {
    id: "region-sultra",
    code: "ID-SG",
    name: "Sulawesi Tenggara",
    slug: "sulawesi-tenggara",
    level: "province",
  },
  coverageType: "known_occurrence",
  productionValue: null,
  productionYear: null,
  unitCode: null,
  rank: null,
  rankingStatus: "unavailable",
  relatedCompanyName: null,
  notes: null,
  verificationStatus: "verified",
  publicationStatus: "published",
  source: null,
};

function renderMap(
  coverageItems: PublicIntelligenceCoverage[] = [],
  activeCoverageId: string | null = null,
) {
  return renderToStaticMarkup(
    <IntelligenceLocationMap
      commoditySlug="nikel"
      coverage={coverageItems}
      locations={[]}
      color="#2ec4b6"
      activeCoverageId={activeCoverageId}
      onCoverageSelect={vi.fn()}
    />,
  );
}

describe("IntelligenceLocationMap", () => {
  it("keeps the Indonesia base map when marker and coverage are empty", () => {
    const html = renderMap();
    expect(html).toContain('data-map-base="indonesia-administrative"');
    expect(html).toContain("Peta administratif Indonesia");
    expect(html).toContain(
      "Koordinat lokasi tambang terverifikasi belum tersedia.",
    );
  });

  it("keeps the base map when coverage exists but markers are empty", () => {
    const html = renderMap([coverage]);
    expect(html).toContain('data-map-base="indonesia-administrative"');
    expect(html).toContain('aria-label="Pilih wilayah Sulawesi Tenggara"');
    expect(html).toContain('fill="#2ec4b6"');
    expect(html).toContain(
      "Koordinat lokasi tambang terverifikasi belum tersedia.",
    );
  });

  it("renders the selected coverage polygon with a stronger highlight", () => {
    const html = renderMap([coverage], coverage.id);
    expect(html).toContain('aria-label="Pilih wilayah Sulawesi Tenggara"');
    expect(html).toContain('fill-opacity="0.72"');
    expect(html).toContain('stroke-width="2.6"');
  });

  it("uses width and overflow guards for narrow viewports", () => {
    const html = renderMap([coverage]);
    expect(html).toContain("min-w-0");
    expect(html).toContain("w-full");
    expect(html).toContain("overflow-hidden");
  });
});
