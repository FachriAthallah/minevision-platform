"use client";

import {
  useCallback,
  useMemo,
  useReducer,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarDays,
  ChartNoAxesCombined,
  Database,
  FileCheck2,
  LineChart as LineChartIcon,
  MapPinned,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { commodityPresentation } from "../config/commodity-presentation";
import {
  calculateObservationChange,
  createTrendInsight,
  getActiveObservation,
  getNextOptionIndex,
  getPriceTrend,
  getPriceYear,
  getProductionTrend,
  intelligenceSelectionReducer,
  resolveYear,
} from "../lib/intelligence-dashboard";
import {
  formatCompactValue,
  formatPercentage,
  formatPriceValue,
} from "../lib/intelligence-format";
import type {
  PublicIntelligenceCommodity,
  PublicIntelligenceDashboard as PublicIntelligenceDashboardData,
} from "../types/dashboard";
import {
  IntelligencePriceChart,
  IntelligenceProductionChart,
} from "./intelligence-charts";
import { IntelligenceLocationMap } from "./intelligence-map";

const recordTypeLabels = {
  actual: "Aktual",
  provisional: "Sementara",
  projection: "Proyeksi",
  revised: "Revisi",
};

const coverageLabels = {
  primary: "Cakupan utama",
  secondary: "Cakupan sekunder",
  known_occurrence: "Keterdapatan diketahui",
  historical: "Historis",
};

const inputClassName =
  "min-h-11 rounded-xl border border-white/10 bg-[#061122] px-3 text-sm text-white outline-none transition-colors hover:border-white/20 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20";

function triggerMineBot() {
  const mineBot = document.getElementById("minebot");
  if (mineBot instanceof HTMLButtonElement) {
    mineBot.focus();
    mineBot.click();
  }
}

function CommoditySelector({
  commodities,
  selected,
  onSelect,
}: {
  commodities: PublicIntelligenceCommodity[];
  selected: string;
  onSelect: (slug: string) => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? "next" : "previous";
    const nextIndex = getNextOptionIndex(index, direction, commodities.length);
    const next = commodities[nextIndex];
    if (!next) return;
    onSelect(next.slug);
    document.getElementById(`intelligence-commodity-${next.slug}`)?.focus();
  }

  return (
    <aside aria-label="Pemilih komoditas Intelligence" className="min-w-0 lg:self-stretch">
      <div className="space-y-4 lg:sticky lg:top-28">
        <section className="rounded-2xl border border-white/10 bg-[#08172a] p-4 shadow-[0_14px_38px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-2">
            <Database aria-hidden="true" className="size-4 text-brand-cyan" />
            <h2 className="text-lg text-white">Data Intelligence</h2>
          </div>
          <div role="radiogroup" aria-label="Komoditas" className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {commodities.map((commodity, index) => {
              const presentation = commodityPresentation[commodity.slug];
              const Icon = presentation.icon;
              const active = selected === commodity.slug;
              return (
                <button
                  key={commodity.slug}
                  id={`intelligence-commodity-${commodity.slug}`}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`Tampilkan data ${commodity.name}`}
                  onClick={() => onSelect(commodity.slug)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  className={cn(
                    "group flex min-h-11 shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-[background-color,border-color,box-shadow,color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan motion-reduce:transform-none motion-reduce:transition-none lg:w-full",
                    active
                      ? "border-[var(--commodity-color)] bg-[var(--commodity-soft)] shadow-[0_0_24px_var(--commodity-soft)]"
                      : "border-transparent hover:-translate-y-0.5 hover:border-[var(--commodity-color)] hover:bg-[var(--commodity-soft)] hover:shadow-[0_0_24px_var(--commodity-soft)]",
                  )}
                  style={
                    {
                      "--commodity-color": presentation.color,
                      "--commodity-soft": presentation.softColor,
                    } as CSSProperties
                  }
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-[18px] shrink-0 transition-colors duration-200 motion-reduce:transition-none",
                      active
                        ? "text-[var(--commodity-color)]"
                        : "text-[#7f90a5] group-hover:text-[var(--commodity-color)]",
                    )}
                  />
                  <span className={cn("text-sm font-semibold transition-colors duration-200 motion-reduce:transition-none", active ? "text-white" : "text-[#c4ced9] group-hover:text-white")}>{commodity.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="relative hidden overflow-hidden rounded-2xl border border-brand-cyan/25 bg-[#08172a] p-4 lg:block">
          <div aria-hidden="true" className="absolute -right-14 -top-16 size-36 rounded-full bg-brand-cyan/10 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/5">
              <Bot aria-hidden="true" className="size-5 text-brand-cyan" />
            </span>
            <div>
              <h2 className="text-lg leading-6 text-white">Perlu bantuan membaca data?</h2>
              <p className="mt-2 text-xs leading-5 text-[#8fa0b4]">Tanyakan istilah, tren, atau konteks data yang sedang Anda lihat kepada MineBot.</p>
            </div>
          </div>
          <button type="button" onClick={triggerMineBot} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,var(--brand-blue),var(--brand-cyan),var(--brand-teal))] px-4 text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan">
            Tanya MineBot AI <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        </section>
      </div>
    </aside>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div role="status" className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-[#061122] px-6 text-center">
      <ChartNoAxesCombined aria-hidden="true" className="size-10 text-brand-cyan" />
      <h3 className="mt-4 text-xl text-white">{title}</h3>
      <p className="mt-2 max-w-lg text-sm leading-7 text-[#8fa0b4]">{description}</p>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, color }: { icon: typeof BarChart3; label: string; value: string; detail: string; color: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-[#08172a]/90 p-4 shadow-[0_14px_38px_rgba(0,0,0,.18)] sm:p-5">
      <Icon aria-hidden="true" className="size-5" style={{ color }} />
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-[#8292a6]">{label}</p>
      <p className="mt-1 break-words text-xl font-bold text-white sm:text-2xl">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#8fa0b4]">{detail}</p>
    </div>
  );
}

export function IntelligenceDashboard({ dashboard }: { dashboard: PublicIntelligenceDashboardData }) {
  const first = dashboard.commodities[0];
  const [state, dispatch] = useReducer(intelligenceSelectionReducer, {
    commodity: first?.slug ?? "",
    tab: "production",
    productionYears: {},
    priceYears: {},
  });
  const [activeCoverage, setActiveCoverage] = useState<string | null>(null);
  const commodity = dashboard.commodities.find((item) => item.slug === state.commodity) ?? first;

  const handleCoverageSelect = useCallback((coverageId: string) => {
    setActiveCoverage(coverageId);
  }, []);

  const production = useMemo(() => getProductionTrend(commodity?.production ?? []), [commodity]);
  const prices = useMemo(() => getPriceTrend(commodity?.prices ?? []), [commodity]);
  const productionYears = production.map((record) => record.year);
  const priceYears = prices.map(getPriceYear);
  const selectedProductionYear = resolveYear(state.productionYears[state.commodity], productionYears);
  const selectedPriceYear = resolveYear(state.priceYears[state.commodity], priceYears);
  const activeProduction = getActiveObservation(production, selectedProductionYear, (record) => record.year);
  const activePrice = getActiveObservation(prices, selectedPriceYear, getPriceYear);
  const productionChange = calculateObservationChange(production, activeProduction);
  const priceChange = calculateObservationChange(prices, activePrice);

  if (!commodity) {
    return <EmptyPanel title="Data Intelligence belum tersedia" description="Belum ada seri kanonik terverifikasi dan dipublikasikan yang dapat ditampilkan." />;
  }

  const presentation = commodityPresentation[commodity.slug];
  const isProduction = state.tab === "production";
  const activeRecord = isProduction ? activeProduction : activePrice;
  const activeYear = activeRecord
    ? isProduction
      ? activeProduction!.year
      : getPriceYear(activePrice!)
    : null;
  const change = isProduction ? productionChange : priceChange;
  const currentValue = isProduction
    ? activeProduction
      ? formatCompactValue(activeProduction.value, activeProduction.unit.symbol)
      : "Belum tersedia"
    : activePrice
      ? formatPriceValue(activePrice.value, activePrice.currencyCode, activePrice.unit.symbol)
      : "Belum tersedia";
  const recordType = activeRecord ? recordTypeLabels[activeRecord.recordType] : "Tidak tersedia";
  const source = isProduction
    ? activeProduction?.sources.find((item) => item.isPrimary) ?? activeProduction?.sources[0]
    : activePrice?.source;

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, tab: "production" | "price") {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const next = tab === "production" ? "price" : "production";
    dispatch({ type: "tab", value: next });
    document.getElementById(`intelligence-tab-${next}`)?.focus();
  }

  return (
    <div className="grid min-w-0 gap-7 lg:grid-cols-[270px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
      <CommoditySelector commodities={dashboard.commodities} selected={commodity.slug} onSelect={(slug) => { dispatch({ type: "commodity", value: slug }); setActiveCoverage(null); }} />

      <div className="min-w-0 space-y-6">
        <header className="rounded-3xl border border-white/10 bg-[#0a192d] p-5 shadow-[0_18px_52px_rgba(0,0,0,.2)] sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: presentation.color }}>Intelligence Komoditas</p>
          <h2 className="mt-2 text-3xl leading-tight text-white sm:text-4xl">Data {commodity.name} Indonesia</h2>
          <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-7 text-[#9facba]">{commodity.description ?? "Tren produksi, harga domestik, dan cakupan wilayah dari dataset publik terverifikasi."}</p>
        </header>

        <section aria-label="Ringkasan data terpilih" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard icon={isProduction ? BarChart3 : LineChartIcon} label={isProduction ? "Produksi Terpilih" : "Harga Terpilih"} value={currentValue} detail={isProduction ? "Satuan kanonik tetap dipertahankan" : activePrice?.standard.name ?? "Seri harga domestik kanonik"} color={presentation.color} />
          <MetricCard icon={change !== null && change < 0 ? TrendingDown : TrendingUp} label="Perubahan" value={formatPercentage(change)} detail="Dibanding observasi sebelumnya yang tersedia" color={presentation.color} />
          <MetricCard icon={CalendarDays} label="Tahun Data" value={activeYear === null ? "—" : String(activeYear)} detail="Missing year tidak dihitung sebagai nol" color={presentation.color} />
          <MetricCard icon={FileCheck2} label="Status Record" value={recordType} detail="Kanonik · terverifikasi · dipublikasikan" color={presentation.color} />
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a192d] shadow-[0_18px_52px_rgba(0,0,0,.2)]">
          <div role="tablist" aria-label="Jenis data Intelligence" className="flex border-b border-white/10 px-5 sm:px-7">
            {(["production", "price"] as const).map((tab) => {
              const active = state.tab === tab;
              return (
                <button
                  key={tab}
                  id={`intelligence-tab-${tab}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`intelligence-panel-${tab}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => dispatch({ type: "tab", value: tab })}
                  onKeyDown={(event) => handleTabKeyDown(event, tab)}
                  className="relative min-h-14 px-4 text-sm font-bold text-[#9facba] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-cyan"
                  style={{ color: active ? "#ffffff" : undefined }}
                >
                  {tab === "production" ? "Produksi" : "Harga"}
                  {active ? <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-0.5" style={{ backgroundColor: presentation.color }} /> : null}
                </button>
              );
            })}
          </div>

          <div id={`intelligence-panel-${state.tab}`} role="tabpanel" aria-labelledby={`intelligence-tab-${state.tab}`} className="p-5 sm:p-7">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(260px,.75fr)]">
              <div className="min-w-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl text-white sm:text-2xl">{isProduction ? `Produksi ${commodity.name} Indonesia` : `Harga ${commodity.name} Indonesia`}</h3>
                    <p className="mt-1 text-xs text-[#8292a6]">{isProduction ? production[0]?.unit.name ?? "Satuan belum tersedia" : activePrice ? `${activePrice.standard.code} · ${activePrice.currencyCode}/${activePrice.unit.symbol}` : "Harga domestik canonical"}</p>
                  </div>
                  <label className="flex shrink-0 flex-col gap-1.5 text-xs font-bold text-[#a8b5c5]">
                    <span>{isProduction ? "Pilih tahun produksi" : "Pilih tahun harga"}</span>
                    <select
                      aria-label={isProduction ? "Pilih tahun produksi" : "Pilih tahun harga"}
                      value={isProduction ? selectedProductionYear : selectedPriceYear}
                      onChange={(event) => dispatch({ type: "year", tab: state.tab, commodity: commodity.slug, value: event.target.value })}
                      className={inputClassName}
                    >
                      <option value="all">Semua Tahun</option>
                      {(isProduction ? productionYears : priceYears).map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </label>
                </div>

                <div className="mt-5">
                  {isProduction ? (
                    production.length ? <IntelligenceProductionChart records={production} selectedYear={selectedProductionYear} color={presentation.color} /> : <EmptyPanel title="Data produksi belum tersedia" description="Seri produksi kanonik public-default yang terverifikasi dan dipublikasikan belum tersedia untuk komoditas ini." />
                  ) : prices.length ? (
                    <IntelligencePriceChart records={prices} selectedYear={selectedPriceYear} color={presentation.color} />
                  ) : (
                    <EmptyPanel title="Data harga belum tersedia" description="Data harga domestik terverifikasi belum tersedia untuk komoditas ini." />
                  )}
                </div>

                {source ? (
                  <div className="mt-4 border-t border-white/8 pt-4 text-xs leading-5 text-[#8292a6]">
                    <span className="font-bold text-[#b9c5d2]">Sumber: </span>
                    {"source" in source ? source.source.name : source.name}
                    {"source" in source && source.pageReference ? ` · ${source.pageReference}` : ""}
                  </div>
                ) : null}
              </div>

              <aside className="rounded-2xl border border-white/10 bg-[#061122] p-5">
                <Sparkles aria-hidden="true" className="size-5" style={{ color: presentation.color }} />
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.13em] text-[#8292a6]">Insight Data</p>
                <h3 className="mt-2 text-xl text-white">Ringkasan tren terpilih</h3>
                <p className="mt-3 text-sm leading-7 text-[#a8b5c5]">{createTrendInsight(isProduction ? "Produksi" : "Harga", activeYear, change)}</p>
                <p className="mt-5 border-t border-white/8 pt-4 text-xs leading-6 text-[#7f90a5]">Insight dihitung secara deterministik dari observasi publik. MineVision tidak menambahkan penyebab yang tidak disebutkan sumber.</p>
              </aside>
            </div>
          </div>
        </section>

        <section aria-labelledby="intelligence-map-heading" className="rounded-3xl border border-white/10 bg-[#0a192d] p-5 shadow-[0_18px_52px_rgba(0,0,0,.2)] sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10" style={{ backgroundColor: presentation.softColor }}><MapPinned aria-hidden="true" className="size-5" style={{ color: presentation.color }} /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: presentation.color }}>Persebaran Indonesia</p>
              <h2 id="intelligence-map-heading" className="mt-1 text-2xl text-white">Cakupan Wilayah {commodity.name}</h2>
              <p className="mt-2 text-sm leading-7 text-[#8fa0b4]">Coverage menunjukkan hubungan wilayah yang terverifikasi, bukan peringkat produksi. Marker hanya muncul untuk lokasi dengan koordinat yang lengkap dan layak ditampilkan.</p>
            </div>
          </div>

          <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,.7fr)]">
            <div className="min-w-0">
              <IntelligenceLocationMap
                coverage={commodity.coverage}
                commoditySlug={commodity.slug}
                locations={commodity.locations}
                color={presentation.color}
                activeCoverageId={activeCoverage}
                onCoverageSelect={handleCoverageSelect}
              />
              <div
                aria-label="Legenda peta"
                className="mt-4 flex flex-wrap gap-x-5 gap-y-2 rounded-xl border border-white/8 bg-[#061122] px-4 py-3 text-xs leading-5 text-[#9aa9ba]"
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-sm border"
                    style={{
                      borderColor: presentation.color,
                      backgroundColor: `${presentation.color}61`,
                    }}
                  />
                  Arsiran: wilayah coverage komoditas
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-sm border-2"
                    style={{
                      borderColor: presentation.color,
                      backgroundColor: `${presentation.color}B3`,
                    }}
                  />
                  Highlight kuat: wilayah dipilih
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: presentation.color }}
                  />
                  Marker: lokasi berkoordinat terverifikasi
                </span>
              </div>
            </div>
            <div className="min-w-0 rounded-2xl border border-white/10 bg-[#061122] p-4">
              <h3 className="font-sans text-sm font-bold text-white">Wilayah coverage publik</h3>
              {commodity.coverage.length ? (
                <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {commodity.coverage.map((coverage) => {
                    const active = activeCoverage === coverage.id;
                    const regionLocations = commodity.locations.filter(
                      (location) => location.region.id === coverage.region.id,
                    );
                    const siteNames = [...new Set(regionLocations.map((location) => location.siteName))];
                    const companyNames = [
                      ...new Set(
                        [
                          coverage.relatedCompanyName,
                          ...regionLocations.map((location) => location.companyName),
                        ].filter((name): name is string => Boolean(name)),
                      ),
                    ];
                    return (
                      <li key={coverage.id}>
                        <button type="button" aria-pressed={active} onClick={() => setActiveCoverage(active ? null : coverage.id)} className={cn("w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan", active ? "border-[var(--commodity-color)] bg-[var(--commodity-soft)]" : "border-white/8 hover:border-white/20")} style={{ "--commodity-color": presentation.color, "--commodity-soft": presentation.softColor } as CSSProperties}>
                          <span className="block text-sm font-bold text-white">{coverage.region.name}</span>
                          <span className="mt-1 block text-xs text-[#8292a6]">{coverageLabels[coverage.coverageType]} · {coverage.region.level === "province" ? "Provinsi" : coverage.region.level}</span>
                          {active ? (
                            <span className="mt-3 block space-y-1.5 border-t border-white/8 pt-3 text-xs leading-5 text-[#a8b5c5]">
                              <span className="block">Area/site: {siteNames.join(", ") || "Belum tersedia"}</span>
                              <span className="block">Perusahaan: {companyNames.join(", ") || "Belum tersedia"}</span>
                              <span className="block">Peringkat: {coverage.rankingStatus === "verified" && coverage.rank ? coverage.rank : "Belum tersedia"}</span>
                              <span className="block">Sumber: {coverage.source?.name ?? "Belum tersedia"}</span>
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="mt-4 text-sm leading-6 text-[#8fa0b4]">Coverage publik yang terverifikasi dan dipublikasikan belum tersedia. Peta administratif tetap dapat digunakan sebagai konteks wilayah.</p>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-brand-cyan/20 bg-[linear-gradient(110deg,rgba(40,103,228,.12),rgba(0,177,196,.1),rgba(60,195,171,.08))] p-5 lg:hidden">
          <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/5"><Bot aria-hidden="true" className="size-5 text-brand-cyan" /></span><div><h2 className="text-lg text-white">Tanya MineBot AI</h2><p className="mt-2 text-sm leading-6 text-[#9facba]">Perlu bantuan membaca istilah atau tren pada data ini?</p></div></div>
          <button type="button" onClick={triggerMineBot} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(90deg,var(--brand-blue),var(--brand-cyan),var(--brand-teal))] px-5 text-sm font-bold text-white">Tanya MineBot AI</button>
        </section>
      </div>
    </div>
  );
}
