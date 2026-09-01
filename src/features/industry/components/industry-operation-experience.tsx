"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPinned, X } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  filterOperationSitesByCompany,
  getIndustryMarkerColor,
} from "@/features/industry/lib/industry-company-view";
import type {
  PublicIndustryCompanySummary,
  PublicIndustryOperationSite,
} from "@/features/industry/types/industry";

import { IndustryState } from "./industry-states";

type MapLibreModule = typeof import("maplibre-gl");

type MarkerElementState = {
  button: HTMLButtonElement;
  dot: HTMLSpanElement;
  color: string;
};

const selectClassName =
  "min-h-11 w-full rounded-xl border border-border bg-background/80 px-4 text-sm text-foreground outline-none transition-colors hover:border-brand-cyan/40 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20";

const siteTypeLabels: Record<PublicIndustryOperationSite["siteType"], string> = {
  mine: "Tambang",
  underground_mine: "Tambang bawah tanah",
  smelter: "Smelter",
  refinery: "Refinery",
  port: "Pelabuhan",
  industrial_complex: "Kawasan industri",
  project: "Proyek",
  operating_area: "Area operasi",
};

function formatCommoditySlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toLocaleUpperCase("id-ID") + part.slice(1))
    .join(" ");
}

function IndustryOperationMap({
  sites,
  selectedCompanySlug,
}: {
  sites: PublicIndustryOperationSite[];
  selectedCompanySlug: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const moduleRef = useRef<MapLibreModule | null>(null);
  const markerElementsRef = useRef<Map<string, MarkerElementState>>(new Map());
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [selectedSite, setSelectedSite] =
    useState<PublicIndustryOperationSite | null>(null);

  const visibleSites = useMemo(
    () => filterOperationSitesByCompany(sites, selectedCompanySlug),
    [selectedCompanySlug, sites],
  );

  useEffect(() => {
    let disposed = false;

    async function initializeMap() {
      if (!containerRef.current || mapRef.current) return;

      try {
        const maplibregl = await import("maplibre-gl");
        if (disposed || !containerRef.current) return;

        moduleRef.current = maplibregl;
        const map = new maplibregl.Map({
          container: containerRef.current,
          center: [118, -2],
          zoom: 3.7,
          minZoom: 3,
          maxZoom: 15,
          attributionControl: { compact: true },
          style: {
            version: 8,
            sources: {
              openStreetMap: {
                type: "raster",
                tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution:
                  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
              },
            },
            layers: [
              {
                id: "openStreetMap",
                type: "raster",
                source: "openStreetMap",
              },
            ],
          },
        });

        map.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          "top-right",
        );
        map.on("load", () => {
          const canvas = map.getCanvas();
          canvas.setAttribute(
            "aria-label",
            "Peta interaktif lokasi operasi industri pertambangan Indonesia",
          );
          setMapReady(true);
        });
        mapRef.current = map;
      } catch (error: unknown) {
        console.error("Failed to initialize Industry operation map:", error);
        setMapError(true);
      }
    }

    void initializeMap();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      moduleRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = moduleRef.current;
    if (!map || !maplibregl || !mapReady) return;

    setSelectedSite(null);
    const markerElements = new Map<string, MarkerElementState>();
    markerElementsRef.current = markerElements;
    const markers = visibleSites.map((site) => {
      const longitude = Number(site.longitude);
      const latitude = Number(site.latitude);
      const color = getIndustryMarkerColor(site.company.slug);
      const element = document.createElement("button");
      element.type = "button";
      element.setAttribute(
        "aria-label",
        `${site.name}, ${site.company.name}, ${site.provinceName}`,
      );
      element.setAttribute("aria-pressed", "false");
      element.title = `${site.name} — ${site.company.name}`;
      element.style.width = "32px";
      element.style.height = "32px";
      element.style.display = "grid";
      element.style.placeItems = "center";
      element.style.padding = "5px";
      element.style.border = "0";
      element.style.background = "transparent";
      element.style.cursor = "pointer";

      const dot = document.createElement("span");
      dot.setAttribute("aria-hidden", "true");
      dot.style.display = "block";
      dot.style.width = "22px";
      dot.style.height = "22px";
      dot.style.borderRadius = "9999px";
      dot.style.border = "3px solid #ffffff";
      dot.style.backgroundColor = color;
      dot.style.boxShadow = `0 0 0 2px ${color}, 0 5px 14px rgba(2,8,23,.38)`;
      dot.style.pointerEvents = "none";
      dot.style.transition = "transform 160ms ease, box-shadow 160ms ease";
      element.append(dot);

      element.addEventListener("mouseenter", () => {
        dot.style.transform = "scale(1.2)";
      });
      element.addEventListener("mouseleave", () => {
        if (element.getAttribute("aria-pressed") !== "true") {
          dot.style.transform = "scale(1)";
        }
      });
      element.addEventListener("focus", () => {
        dot.style.transform = "scale(1.2)";
        dot.style.boxShadow = `0 0 0 3px #ffffff, 0 0 0 6px ${color}, 0 6px 16px rgba(2,8,23,.42)`;
      });
      element.addEventListener("blur", () => {
        if (element.getAttribute("aria-pressed") !== "true") {
          dot.style.transform = "scale(1)";
          dot.style.boxShadow = `0 0 0 2px ${color}, 0 5px 14px rgba(2,8,23,.38)`;
        }
      });

      markerElements.set(site.id, { button: element, dot, color });
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        markerElementsRef.current.forEach((markerElement, markerId) => {
          const isSelected = markerId === site.id;
          markerElement.button.setAttribute(
            "aria-pressed",
            String(isSelected),
          );
          markerElement.dot.style.transform = isSelected
            ? "scale(1.25)"
            : "scale(1)";
          markerElement.dot.style.boxShadow = isSelected
            ? `0 0 0 3px #ffffff, 0 0 0 6px ${markerElement.color}, 0 6px 16px rgba(2,8,23,.42)`
            : `0 0 0 2px ${markerElement.color}, 0 5px 14px rgba(2,8,23,.38)`;
        });
        setSelectedSite(site);
      });

      return new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat([longitude, latitude])
        .addTo(map);
    });

    if (visibleSites.length === 1) {
      const site = visibleSites[0]!;
      map.easeTo({
        center: [Number(site.longitude), Number(site.latitude)],
        zoom: 9,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 700,
      });
    } else if (visibleSites.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      visibleSites.forEach((site) => {
        bounds.extend([Number(site.longitude), Number(site.latitude)]);
      });
      map.fitBounds(bounds, {
        padding: 54,
        maxZoom: selectedCompanySlug ? 10 : 5.4,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 700,
      });
    }

    return () => {
      markerElements.clear();
      markers.forEach((marker) => marker.remove());
    };
  }, [mapReady, selectedCompanySlug, visibleSites]);

  function clearSelectedSite() {
    markerElementsRef.current.forEach((markerElement) => {
      markerElement.button.setAttribute("aria-pressed", "false");
      markerElement.dot.style.transform = "scale(1)";
      markerElement.dot.style.boxShadow = `0 0 0 2px ${markerElement.color}, 0 5px 14px rgba(2,8,23,.38)`;
    });
    setSelectedSite(null);
  }

  if (mapError) {
    return (
      <IndustryState
        kind="error"
        title="Peta belum dapat dimuat"
        description="Basemap atau library peta tidak dapat dimuat. Data lokasi publik tetap terlindungi dan Anda dapat mencoba kembali beberapa saat lagi."
      />
    );
  }

  if (visibleSites.length === 0) {
    return (
      <IndustryState
        kind="operations"
        title="Lokasi operasi belum tersedia"
        description="Tidak ada lokasi berkoordinat yang terverifikasi dan dipublikasikan untuk pilihan ini."
      />
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[#d9e5e7] shadow-[0_20px_55px_rgba(0,0,0,0.22)]">
        {!mapReady ? (
          <div role="status" className="absolute inset-0 z-10 flex items-center justify-center bg-surface">
            <div className="text-center">
              <span aria-hidden="true" className="mx-auto block size-9 animate-spin rounded-full border-2 border-brand-cyan/30 border-t-brand-cyan motion-reduce:animate-none" />
              <p className="mt-4 text-sm font-bold text-foreground">Memuat peta lokasi operasi</p>
            </div>
          </div>
        ) : null}
        <div ref={containerRef} className="h-[30rem] w-full sm:h-[36rem] lg:h-[42rem]" />
        {selectedSite ? (
          <aside
            aria-label={`Informasi lokasi ${selectedSite.name}`}
            aria-live="polite"
            className="absolute inset-x-3 bottom-3 z-20 max-h-[46%] overflow-y-auto rounded-2xl border border-white/15 bg-[#061122]/95 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.42)] backdrop-blur-md sm:left-4 sm:right-auto sm:bottom-4 sm:max-h-[70%] sm:w-[24rem] sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
                  {selectedSite.company.name}
                </p>
                <h3 className="mt-1 text-lg leading-7 text-white">
                  {selectedSite.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={clearSelectedSite}
                aria-label="Tutup informasi lokasi"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-[#b8c7d8] transition-colors hover:border-brand-cyan/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan motion-reduce:transition-none"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-bold text-white">Wilayah</dt>
                <dd className="mt-1 leading-6 text-[#9fb0c3]">
                  {[selectedSite.regencyName, selectedSite.provinceName]
                    .filter(Boolean)
                    .join(", ")}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-white">Jenis lokasi</dt>
                <dd className="mt-1 leading-6 text-[#9fb0c3]">
                  {siteTypeLabels[selectedSite.siteType]}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-white">Komoditas</dt>
                <dd className="mt-1 leading-6 text-[#9fb0c3]">
                  {selectedSite.commoditySlugs.length
                    ? selectedSite.commoditySlugs
                        .map(formatCommoditySlug)
                        .join(", ")
                    : "Tidak dicantumkan"}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-white">Status</dt>
                <dd className="mt-1 leading-6 text-[#9fb0c3]">
                  {selectedSite.statusLabel}
                </dd>
              </div>
            </dl>

            {selectedSite.locationDescription ? (
              <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-6 text-[#9fb0c3]">
                {selectedSite.locationDescription}
              </p>
            ) : null}
          </aside>
        ) : null}
      </div>

      <p role="status" aria-live="polite" className="mt-4 text-sm text-muted-foreground">
        Menampilkan {visibleSites.length} lokasi operasi publik
        {selectedCompanySlug ? " untuk perusahaan terpilih" : " dari seluruh perusahaan"}.
      </p>

    </div>
  );
}

export function IndustryOperationExperience({
  companies,
  operationSites,
}: {
  companies: PublicIndustryCompanySummary[];
  operationSites: PublicIndustryOperationSite[];
}) {
  const [selectedCompanySlug, setSelectedCompanySlug] = useState("");

  return (
    <section aria-labelledby="industry-operations-heading">
      <div className="flex flex-col gap-6 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-teal">Eksplorasi Geografis</p>
          <h2 id="industry-operations-heading" className="mt-2 text-3xl text-foreground">Wilayah Operasi</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Jelajahi persebaran tambang, smelter, refinery, proyek, pelabuhan, kawasan industri, dan fasilitas lain yang mendukung kegiatan perusahaan.
          </p>
        </div>
        <div className="w-full lg:max-w-sm">
          <label htmlFor="operation-company" className="text-sm font-bold text-foreground">Perusahaan</label>
          <select
            id="operation-company"
            value={selectedCompanySlug}
            onChange={(event) => setSelectedCompanySlug(event.target.value)}
            className={`${selectClassName} mt-2`}
          >
            <option value="">Semua Perusahaan</option>
            {companies.map((company) => <option key={company.id} value={company.slug}>{company.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-cyan/20 bg-brand-cyan/5 p-4 text-sm leading-6 text-muted-foreground">
        <MapPinned aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-cyan" />
        <p>Pilih perusahaan untuk memusatkan peta, lalu tekan salah satu titik untuk melihat nama, wilayah, jenis fasilitas, komoditas, dan status operasinya.</p>
      </div>

      <div className="mt-6">
        <IndustryOperationMap sites={operationSites} selectedCompanySlug={selectedCompanySlug} />
      </div>

      {selectedCompanySlug === "" ? (
        <div aria-label="Legenda warna perusahaan" className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-sans text-sm font-bold text-foreground">Legenda perusahaan</h3>
          <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <li key={company.id} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span aria-hidden="true" className="size-3.5 shrink-0 rounded-full border-2 border-white" style={{ backgroundColor: getIndustryMarkerColor(company.slug), boxShadow: `0 0 0 1px ${getIndustryMarkerColor(company.slug)}` }} />
                <span>{company.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
