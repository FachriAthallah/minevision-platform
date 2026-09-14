"use client";

import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  Database,
  ExternalLink,
  Factory,
  FileCheck2,
  FileText,
  Landmark,
  Search,
  Ship,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { publicRoutes } from "@/config/site";

import {
  createGdpInsight,
  getGdpTrend,
  getNextEconomySection,
  getPrimarySmelterOutputs,
  getSmelterCommoditySummary,
  resolveEconomySection,
  resolveGdpYear,
} from "../lib/economy-dashboard";
import {
  formatEconomyCurrency,
  formatEconomyNumber,
  formatEconomyPercentage,
  formatEconomyValue,
} from "../lib/economy-format";
import type {
  EconomyRegulationStatus,
  EconomySection,
  PublicEconomyDashboard,
} from "../types/dashboard";
import {
  EconomyGroupedInvestmentChart,
  EconomyReadyBarChart,
  GdpContributionChart,
  GdpValueChart,
} from "./economy-charts";

const sectionItems = [
  { id: "gdp", label: "PDB", description: "Kontribusi dan nilai nominal", icon: BarChart3 },
  { id: "exports", label: "Ekspor", description: "Nilai FOB dan tujuan", icon: Ship },
  { id: "investment", label: "Investasi", description: "PMA dan PMDN", icon: WalletCards },
  { id: "downstream", label: "Hilirisasi", description: "Fasilitas pengolahan", icon: Factory },
  { id: "regulations", label: "Regulasi", description: "Kebijakan minerba", icon: FileText },
] as const;

const dataStatusLabels = {
  final: "Final",
  preliminary: "Sementara",
  very_preliminary: "Sangat sementara",
};

const facilityTypeLabels = {
  smelter: "Smelter",
  refinery: "Refinery",
  integrated_processing: "Pengolahan terintegrasi",
  other: "Fasilitas lainnya",
};

const regulationStatusLabels: Record<EconomyRegulationStatus, string> = {
  active: "Berlaku",
  amended: "Diubah",
  revoked: "Dicabut",
  unknown: "Belum dikonfirmasi",
};

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-[#08172a]/95 p-4 shadow-[0_14px_38px_rgba(0,0,0,.18)] sm:p-5">
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-cyan" />
        <div className="min-w-0">
          <p className="break-words text-xl font-bold leading-tight text-white sm:text-2xl">{value}</p>
          <p className="mt-1 text-sm font-bold text-white">{label}</p>
          <p className="mt-2 text-xs leading-5 text-[#8fa0b4]">{description}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  detail,
}: {
  title: string;
  description: string;
  detail: string;
}) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-[#061122] px-6 py-12 text-center">
      <ChartNoAxesCombined aria-hidden="true" className="size-10 text-brand-cyan" />
      <h3 className="mt-5 max-w-xl text-2xl text-white">{title}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#a7b4c4]">{description}</p>
      <p className="mt-5 max-w-2xl rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3 text-xs leading-6 text-[#7f90a5]">{detail}</p>
    </div>
  );
}

function SourceList({
  sources,
}: {
  sources: Array<{ label: string; url: string | null; organization: string }>;
}) {
  const unique = [...new Map(sources.map((source) => [`${source.label}|${source.url}`, source])).values()];
  if (!unique.length) return <p className="text-sm text-[#8fa0b4]">Sumber publik belum tersedia.</p>;

  return (
    <ul className="space-y-2">
      {unique.map((source) => (
        <li key={`${source.label}-${source.url}`} className="rounded-xl border border-white/8 bg-[#061122] px-4 py-3 text-sm leading-6 text-[#b7c3d1]">
          {source.url ? (
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 font-semibold text-white transition-colors hover:text-brand-cyan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan">
              {source.label}<ExternalLink aria-hidden="true" className="mt-1 size-3.5 shrink-0" />
            </a>
          ) : <span className="font-semibold text-white">{source.label}</span>}
          <span className="block text-xs text-[#8292a6]">{source.organization}</span>
        </li>
      ))}
    </ul>
  );
}

function GdpSection({ records }: { records: PublicEconomyDashboard["gdp"] }) {
  const trend = useMemo(() => getGdpTrend(records), [records]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const activeYear = resolveGdpYear(selectedYear, trend);
  const activeRecord = trend.find((record) => record.year === activeYear);
  const sources = trend.flatMap((record) => record.sources.map((source) => ({
    label: source.label,
    url: source.url,
    organization: source.source.organization,
  })));

  if (!activeRecord) {
    return <EmptyState title="Data PDB belum tersedia" description="Belum ada record PDB yang terverifikasi dan dipublikasikan." detail="Data draft tidak digunakan sebagai pengganti." />;
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="gdp-heading" className="rounded-3xl border border-white/10 bg-[#0a192d] p-5 shadow-[0_18px_52px_rgba(0,0,0,.2)] sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">Produk Domestik Bruto</p>
            <h2 id="gdp-heading" className="mt-2 text-2xl text-white sm:text-3xl">PDB Pertambangan Indonesia</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9facba]">Seri atas dasar harga berlaku (ADHB). Perubahan tahunan di bawah adalah perubahan nominal, bukan pertumbuhan ekonomi riil.</p>
          </div>
          <label className="flex shrink-0 flex-col gap-1.5 text-xs font-bold text-[#a8b5c5]">
            <span>Pilih tahun PDB</span>
            <select aria-label="Pilih tahun PDB" value={activeYear ?? ""} onChange={(event) => setSelectedYear(Number(event.target.value))} className="min-h-11 rounded-xl border border-white/10 bg-[#061122] px-3 text-sm text-white outline-none transition-colors hover:border-white/20 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20">
              {trend.map((record) => <option key={record.year} value={record.year}>{record.year}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section aria-label="Ringkasan PDB tahun terpilih" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard icon={TrendingUp} label="Kontribusi PDB" value={formatEconomyPercentage(activeRecord.contributionPercentage)} description="Porsi Pertambangan dan Penggalian terhadap PDB nasional." />
        <MetricCard icon={CircleDollarSign} label="Nilai Tambah Bruto" value={formatEconomyCurrency(activeRecord.miningQuarryingGdpValue, activeRecord.currencyCode, activeRecord.valueScale)} description="Nilai nominal sektor Pertambangan dan Penggalian ADHB." />
        <MetricCard icon={BarChart3} label="Perubahan Nominal" value={formatEconomyPercentage(activeRecord.nominalYoyChangePercentage, true)} description="Dibanding observasi publik tahun sebelumnya." />
        <MetricCard icon={FileCheck2} label="Status Data" value={dataStatusLabels[activeRecord.dataStatus]} description={`${activeRecord.year} · ${activeRecord.priceBasis === "current_prices" ? "ADHB" : "ADHK"}`} />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="min-w-0 rounded-3xl border border-white/10 bg-[#0a192d] p-5 sm:p-6">
          <h3 className="text-xl text-white">Kontribusi terhadap PDB Nasional</h3>
          <p className="mt-1 text-xs text-[#8292a6]">Persentase · 2019–2025</p>
          <div className="mt-4"><GdpContributionChart records={trend} activeYear={activeYear} /></div>
        </section>
        <section className="min-w-0 rounded-3xl border border-white/10 bg-[#0a192d] p-5 sm:p-6">
          <h3 className="text-xl text-white">Nilai Nominal PDB Pertambangan</h3>
          <p className="mt-1 text-xs text-[#8292a6]">ADHB · unit sumber {activeRecord.valueScale}</p>
          <div className="mt-4"><GdpValueChart records={trend} activeYear={activeYear} /></div>
        </section>
      </div>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a192d]">
        <div className="border-b border-white/10 px-5 py-5 sm:px-6"><h3 className="text-xl text-white">Rincian PDB 2019–2025</h3></div>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead className="bg-[#061122] text-xs uppercase tracking-[0.08em] text-[#8292a6]"><tr><th className="px-5 py-4">Tahun</th><th className="px-5 py-4">PDB Nasional ADHB</th><th className="px-5 py-4">PDB Pertambangan ADHB</th><th className="px-5 py-4">Kontribusi</th><th className="px-5 py-4">Perubahan nominal</th><th className="px-5 py-4">Status</th></tr></thead>
            <tbody className="divide-y divide-white/8 text-[#b7c3d1]">
              {trend.map((record) => <tr key={record.id} className="transition-colors hover:bg-white/[0.025]"><td className="px-5 py-4 font-bold text-white">{record.year}</td><td className="px-5 py-4">{formatEconomyCurrency(record.nationalGdpValue, record.currencyCode, record.valueScale)}</td><td className="px-5 py-4">{formatEconomyCurrency(record.miningQuarryingGdpValue, record.currencyCode, record.valueScale)}</td><td className="px-5 py-4">{formatEconomyPercentage(record.contributionPercentage)}</td><td className="px-5 py-4">{formatEconomyPercentage(record.nominalYoyChangePercentage, true)}</td><td className="px-5 py-4">{dataStatusLabels[record.dataStatus]}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-[#0a192d] p-6"><Landmark aria-hidden="true" className="size-6 text-brand-cyan" /><h3 className="mt-4 text-xl text-white">Tentang PDB</h3><p className="mt-3 text-sm leading-7 text-[#a7b4c4]">PDB atas dasar harga berlaku menggambarkan nilai tambah bruto dengan harga pada tahun berjalan. Karena itu, perubahan nominal dapat mencerminkan perubahan harga maupun volume dan tidak boleh disebut pertumbuhan riil.</p></section>
        <section className="rounded-3xl border border-white/10 bg-[#0a192d] p-6"><Sparkles aria-hidden="true" className="size-6 text-brand-teal" /><h3 className="mt-4 text-xl text-white">Insight Data</h3><p className="mt-3 text-sm leading-7 text-[#a7b4c4]">{createGdpInsight(activeRecord)}</p></section>
      </div>

      <section className="rounded-3xl border border-white/10 bg-[#0a192d] p-6"><h3 className="text-xl text-white">Sumber Resmi</h3><div className="mt-4"><SourceList sources={sources} /></div></section>
    </div>
  );
}

function ExportSection({ records }: { records: PublicEconomyDashboard["exports"] }) {
  const years = [...new Set(records.map((record) => record.year))].sort((a, b) => b - a);
  const [year, setYear] = useState(years[0] ?? 0);
  const active = records.filter((record) => record.year === year);
  const totalFob = active.reduce((sum, record) => sum + (record.fob?.normalizedUsd ?? 0), 0);
  const totalVolume = active.reduce((sum, record) => sum + (record.volume?.normalizedMetricTon ?? 0), 0);
  const commodityMap = new Map<string, number>();
  for (const record of active) {
    const value = record.fob?.normalizedUsd ?? 0;
    const destination = record.destination?.name ?? "Tidak dilaporkan";
    const label = `${record.commodity.name} · ${destination}`;
    commodityMap.set(label, (commodityMap.get(label) ?? 0) + value);
  }

  if (!records.length) {
    return <EmptyState title="Data ekspor sedang melalui proses verifikasi dan belum tersedia untuk publik." description="File sumber memuat satu negara tujuan per komoditas-tahun, bukan total ekspor nasional. HS code, bentuk produk, dan skala beberapa seri juga belum terverifikasi pada tabel BPS yang setara." detail="Record tetap ditahan agar bijih, konsentrat, logam, nilai kosong, dan cakupan tujuan tidak tercampur sebagai satu metrik publik." />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Perdagangan Minerba" title="Ekspor Mineral dan Batubara" description="Ringkasan ekspor hanya mencakup record publik dengan cakupan produk dan tujuan yang jelas." yearLabel="Pilih tahun ekspor" years={years} year={year} onYearChange={setYear} />
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><MetricCard icon={CircleDollarSign} label="Nilai FOB" value={formatEconomyCurrency(totalFob, "USD")} description="Total record publik pada filter aktif." /><MetricCard icon={Ship} label="Berat Bersih" value={formatEconomyValue(totalVolume, "ton")} description="Berat yang tersedia dan ternormalisasi." /><MetricCard icon={Database} label="Komoditas" value={formatEconomyNumber(new Set(active.map((record) => record.commodity.slug)).size)} description="Klasifikasi komoditas publik." /><MetricCard icon={Landmark} label="Negara Tujuan" value={formatEconomyNumber(new Set(active.map((record) => record.destination?.code).filter(Boolean)).size)} description="Tujuan yang dinyatakan sumber." /></section>
      <ChartPanel title="Nilai FOB per Komoditas dan Negara Tujuan"><EconomyReadyBarChart label="Grafik nilai ekspor per komoditas dan negara tujuan" valueLabel="USD" data={[...commodityMap].map(([label, value]) => ({ label, value }))} /></ChartPanel>
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a192d]"><div className="border-b border-white/10 px-5 py-5"><h3 className="text-xl text-white">Ringkasan Ekspor {year}</h3></div><div className="max-w-full overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#061122] text-xs uppercase text-[#8292a6]"><tr><th className="px-5 py-4">Komoditas</th><th className="px-5 py-4">Bentuk</th><th className="px-5 py-4">Tujuan</th><th className="px-5 py-4">Berat</th><th className="px-5 py-4">FOB</th></tr></thead><tbody className="divide-y divide-white/8">{active.map((record) => <tr key={record.id}><td className="px-5 py-4 font-bold text-white">{record.commodity.name}</td><td className="px-5 py-4 text-[#b7c3d1]">{record.commodity.productForm ?? "Belum dirinci"}</td><td className="px-5 py-4 text-[#b7c3d1]">{record.destination?.name ?? "Tidak dirinci"}</td><td className="px-5 py-4 text-[#b7c3d1]">{record.volume ? formatEconomyValue(record.volume.normalizedMetricTon ?? record.volume.value, record.volume.normalizedMetricTon === null ? record.volume.unitCode : "ton") : "Tidak dilaporkan"}</td><td className="px-5 py-4 text-[#b7c3d1]">{record.fob ? formatEconomyCurrency(record.fob.normalizedUsd ?? record.fob.value, record.fob.currencyCode, record.fob.normalizedUsd === null ? record.fob.scale ?? "unit" : "unit") : "Tidak dilaporkan"}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}

function InvestmentSection({ records }: { records: PublicEconomyDashboard["investment"] }) {
  const years = [...new Set(records.map((record) => record.year))].sort((a, b) => b - a);
  const [year, setYear] = useState(years[0] ?? 0);
  const active = records.filter((record) => record.year === year);
  const pma = active.find((record) => record.origin === "pma");
  const pmdn = active.find((record) => record.origin === "pmdn");
  const completeTotal = pma && pmdn ? pma.investmentValue + pmdn.investmentValue : null;
  const annual = years.slice().reverse().map((itemYear) => {
    const rows = records.filter((record) => record.year === itemYear);
    const foreign = rows.find((record) => record.origin === "pma");
    const domestic = rows.find((record) => record.origin === "pmdn");
    return { label: String(itemYear), pma: foreign?.investmentValue ?? null, pmdn: domestic?.investmentValue ?? null };
  });

  if (!records.length) {
    return <EmptyState title="Data investasi sedang melalui proses verifikasi dan belum tersedia untuk publik." description="Rincian PMA, PMDN, dan jumlah proyek pada file sumber belum konsisten dengan total sektor pertambangan dalam publikasi resmi BKPM untuk beberapa tahun. Metodologi konversi PMA dari USD ke rupiah juga belum terdokumentasi." detail="Total investasi tidak dihitung atau dipublikasikan sebelum kedua komponen dan metodologinya dapat dibuktikan." />;
  }

  const currencyCode = active[0]?.currency.code ?? "IDR";
  const valueScale = active[0]?.currency.scale ?? "unit";
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Realisasi Modal" title="Investasi Pertambangan" description="PMA dan PMDN ditampilkan terpisah; total hanya dihitung saat kedua komponen lengkap." yearLabel="Pilih tahun investasi" years={years} year={year} onYearChange={setYear} />
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><MetricCard icon={CircleDollarSign} label="PMA" value={pma ? formatEconomyCurrency(pma.investmentValue, currencyCode, valueScale) : "Belum tersedia"} description="Penanaman Modal Asing." /><MetricCard icon={WalletCards} label="PMDN" value={pmdn ? formatEconomyCurrency(pmdn.investmentValue, currencyCode, valueScale) : "Belum tersedia"} description="Penanaman Modal Dalam Negeri." /><MetricCard icon={TrendingUp} label="Total Investasi" value={completeTotal === null ? "Belum tersedia" : formatEconomyCurrency(completeTotal, currencyCode, valueScale)} description="Hanya dari pasangan PMA dan PMDN lengkap." /><MetricCard icon={Building2} label="Jumlah Proyek" value={active.every((record) => record.projectCount !== null) ? formatEconomyNumber(active.reduce((sum, record) => sum + (record.projectCount ?? 0), 0)) : "Belum tersedia"} description="Proyek yang dilaporkan pada tahun aktif." /></section>
      <ChartPanel title="Perkembangan PMA dan PMDN"><EconomyGroupedInvestmentChart data={annual} currencyCode={currencyCode} valueScale={valueScale} /></ChartPanel>
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a192d]"><div className="border-b border-white/10 px-5 py-5"><h3 className="text-xl text-white">Komposisi PMA dan PMDN</h3></div><div className="max-w-full overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-[#061122] text-xs uppercase text-[#8292a6]"><tr><th className="px-5 py-4">Tahun</th><th className="px-5 py-4">Asal</th><th className="px-5 py-4">Nilai</th><th className="px-5 py-4">Proyek</th></tr></thead><tbody className="divide-y divide-white/8">{records.map((record) => <tr key={record.id}><td className="px-5 py-4 font-bold text-white">{record.year}</td><td className="px-5 py-4 text-[#b7c3d1]">{record.origin.toUpperCase()}</td><td className="px-5 py-4 text-[#b7c3d1]">{formatEconomyCurrency(record.investmentValue, record.currency.code, record.currency.scale)}</td><td className="px-5 py-4 text-[#b7c3d1]">{record.projectCount === null ? "Belum tersedia" : formatEconomyNumber(record.projectCount)}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}

function DownstreamSection({ dashboard }: { dashboard: PublicEconomyDashboard }) {
  const facilities = dashboard.smelters;
  const primaryOutputs = getPrimarySmelterOutputs(facilities);
  const commoditySummary = getSmelterCommoditySummary(facilities);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#0a192d] p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">Pengolahan dan Pemurnian</p><h2 className="mt-2 text-2xl text-white sm:text-3xl">Hilirisasi Mineral Indonesia</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-[#9facba]">Fasilitas aktif yang terverifikasi, dipublikasikan, dan memiliki sumber kanonik layak publik.</p></section>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><MetricCard icon={Factory} label="Fasilitas Eligible" value={formatEconomyNumber(dashboard.meta.smelterFacilityCount)} description="Dua fasilitas HOLD tidak disertakan." /><MetricCard icon={Database} label="Komoditas" value={formatEconomyNumber(dashboard.meta.smelterCommodityCount)} description="Berdasarkan output utama fasilitas." /><MetricCard icon={Landmark} label="Provinsi" value={formatEconomyNumber(dashboard.meta.smelterProvinceCount)} description="Lokasi fasilitas yang dinyatakan sumber." /><MetricCard icon={FileCheck2} label="Output Utama" value={formatEconomyNumber(primaryOutputs.length)} description="Output non-primary tidak dihitung ganda." /></section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-3xl border border-white/10 bg-[#0a192d] p-6"><h3 className="text-xl text-white">Fasilitas per Komoditas</h3><ul className="mt-5 space-y-4">{commoditySummary.map((item) => { const max = Math.max(...commoditySummary.map((row) => row.facilityCount), 1); const capacities = new Map<string, { outputProduct: string; unitCode: string; value: number }>(); for (const capacity of item.primaryCapacity) { const key = `${capacity.outputProduct}|${capacity.unitCode}`; const current = capacities.get(key); capacities.set(key, { outputProduct: capacity.outputProduct, unitCode: capacity.unitCode, value: (current?.value ?? 0) + capacity.value }); } return <li key={item.slug}><div className="flex items-center justify-between gap-4 text-sm"><span className="font-bold text-white">{item.name}</span><span className="text-[#a7b4c4]">{item.facilityCount} fasilitas</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#061122]"><div className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-blue),var(--brand-cyan),var(--brand-teal))]" style={{ width: `${Math.max(14, item.facilityCount / max * 100)}%` }} /></div>{capacities.size ? <p className="mt-2 text-xs leading-5 text-[#8292a6]">{[...capacities.values()].map((capacity) => `${capacity.outputProduct}: ${formatEconomyValue(capacity.value, capacity.unitCode)}`).join(" · ")}</p> : null}</li>; })}</ul></section>
        <section className="rounded-3xl border border-white/10 bg-[#0a192d] p-6"><Factory aria-hidden="true" className="size-6 text-brand-teal" /><h3 className="mt-4 text-xl text-white">Tentang Hilirisasi</h3><p className="mt-3 text-sm leading-7 text-[#a7b4c4]">Hilirisasi mencakup fasilitas pengolahan, pemurnian, dan pengolahan terintegrasi. Ringkasan kapasitas memakai output utama tiap fasilitas dan tidak menjumlahkan produk dengan satuan berbeda sebagai satu angka.</p><p className="mt-4 rounded-xl border border-brand-cyan/15 bg-brand-cyan/5 px-4 py-3 text-xs leading-6 text-[#9facba]">Daftar ini bukan inventaris seluruh fasilitas di Indonesia; hanya record yang memenuhi kontrak publik.</p></section>
      </div>
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a192d]"><div className="border-b border-white/10 px-5 py-5 sm:px-6"><h3 className="text-xl text-white">Fasilitas Publik</h3></div><div className="max-w-full overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-[#061122] text-xs uppercase tracking-[0.06em] text-[#8292a6]"><tr><th className="px-5 py-4">Fasilitas</th><th className="px-5 py-4">Operator</th><th className="px-5 py-4">Lokasi</th><th className="px-5 py-4">Tipe</th><th className="px-5 py-4">Output utama</th><th className="px-5 py-4">Kapasitas</th><th className="px-5 py-4">Sumber</th></tr></thead><tbody className="divide-y divide-white/8">{facilities.map((facility) => { const output = facility.outputs.find((item) => item.isPrimary); const source = facility.sources.find((item) => item.isOfficial) ?? facility.sources[0]; const sourceUrl = source?.url ?? source?.source?.url ?? null; return <tr key={facility.id} className="align-top transition-colors hover:bg-white/[0.025]"><td className="px-5 py-4 font-bold text-white">{facility.name}</td><td className="px-5 py-4 text-[#b7c3d1]">{facility.operator.name}</td><td className="px-5 py-4 text-[#b7c3d1]">{facility.location.cityRegency}, {facility.location.province}</td><td className="px-5 py-4 text-[#b7c3d1]">{facilityTypeLabels[facility.facilityType]}</td><td className="px-5 py-4 text-[#b7c3d1]">{output?.outputProduct ?? "Belum tersedia"}</td><td className="px-5 py-4 text-[#b7c3d1]">{output?.outputCapacity ? formatEconomyValue(output.outputCapacity.value, output.outputCapacity.unitCode) : "Belum tersedia"}</td><td className="px-5 py-4">{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-brand-cyan hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan">{source?.publisherName ?? source?.source?.name ?? "Sumber resmi"}<ExternalLink aria-hidden="true" className="size-3.5" /></a> : <span className="text-[#8292a6]">Belum tersedia</span>}</td></tr>; })}</tbody></table></div></section>
      {commoditySummary.length ? (
        <nav
          aria-label="Profil komoditas hilirisasi"
          className="rounded-3xl border border-white/10 bg-[#0a192d] p-5 sm:p-6"
        >
          <h3 className="text-xl text-white">Profil komoditas terkait</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {commoditySummary.map((commodity) => (
              <Link
                key={commodity.slug}
                href={`/commodity/${commodity.slug}`}
                className="rounded-full border border-brand-cyan/25 bg-brand-cyan/5 px-4 py-2 text-sm font-bold text-brand-cyan transition-colors hover:border-brand-cyan hover:bg-brand-cyan/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan"
              >
                {commodity.name}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}

function RegulationsSection({ regulations }: { regulations: PublicEconomyDashboard["regulations"] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("id");
  const filtered = regulations.filter((record) => !normalizedQuery || [record.type, record.number, record.title, record.subject, String(record.year)].some((value) => value.toLocaleLowerCase("id").includes(normalizedQuery)));
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#0a192d] p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">Kebijakan Minerba</p><h2 className="mt-2 text-2xl text-white sm:text-3xl">Regulasi Pertambangan</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-[#9facba]">Daftar statis terkurasi dari kanal resmi JDIH. Status yang belum terkonfirmasi ditandai secara eksplisit.</p><label className="relative mt-5 block max-w-xl"><span className="sr-only">Cari regulasi</span><Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8292a6]" /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Cari nomor, judul, subjek, atau tahun" className="min-h-12 w-full rounded-xl border border-white/10 bg-[#061122] pl-11 pr-4 text-sm text-white outline-none placeholder:text-[#66768a] focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20" /></label><p className="mt-3 text-xs text-[#8292a6]">{filtered.length} dari {regulations.length} regulasi</p></section>
      {filtered.length ? <div className="grid gap-4 lg:grid-cols-2">{filtered.map((record) => <article key={record.id} className="rounded-2xl border border-white/10 bg-[#0a192d] p-5 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-brand-cyan/30 hover:shadow-[0_14px_38px_rgba(0,0,0,.2)] motion-reduce:transform-none"><div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full border border-brand-cyan/20 bg-brand-cyan/5 px-2.5 py-1 font-bold text-brand-cyan">{record.type} {record.number}/{record.year}</span><span className={cn("rounded-full border px-2.5 py-1 font-bold", record.status === "active" ? "border-success/25 bg-success/5 text-success" : record.status === "unknown" ? "border-warning/25 bg-warning/5 text-warning" : "border-white/10 bg-white/[0.03] text-[#a7b4c4]")}>{regulationStatusLabels[record.status]}</span></div><h3 className="mt-4 text-lg leading-7 text-white">{record.title}</h3><p className="mt-3 text-sm text-[#a7b4c4]">{record.subject}</p>{record.notes ? <p className="mt-3 text-xs leading-6 text-[#8292a6]">{record.notes}</p> : null}<a href={record.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-cyan transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan">Buka sumber resmi<ExternalLink aria-hidden="true" className="size-4" /></a></article>)}</div> : <EmptyState title="Regulasi tidak ditemukan" description="Tidak ada regulasi yang cocok dengan pencarian Anda." detail="Hapus kata pencarian untuk menampilkan kembali seluruh regulasi." />}
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, yearLabel, years, year, onYearChange }: { eyebrow: string; title: string; description: string; yearLabel: string; years: number[]; year: number; onYearChange: (year: number) => void }) {
  return <section className="rounded-3xl border border-white/10 bg-[#0a192d] p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">{eyebrow}</p><h2 className="mt-2 text-2xl text-white sm:text-3xl">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-[#9facba]">{description}</p></div><label className="flex shrink-0 flex-col gap-1.5 text-xs font-bold text-[#a8b5c5]"><span>{yearLabel}</span><select aria-label={yearLabel} value={year} onChange={(event) => onYearChange(Number(event.target.value))} className="min-h-11 rounded-xl border border-white/10 bg-[#061122] px-3 text-sm text-white outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20">{years.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div></section>;
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-3xl border border-white/10 bg-[#0a192d] p-5 sm:p-6"><h3 className="text-xl text-white">{title}</h3><div className="mt-4">{children}</div></section>;
}

function EconomySidebar({ activeSection, onSelect }: { activeSection: EconomySection; onSelect: (section: EconomySection) => void }) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, section: EconomySection) {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 'next' : 'previous';
    const next = getNextEconomySection(section, direction);
    onSelect(next);
    document.getElementById(`economy-section-${next}`)?.focus();
  }
  return <aside aria-label="Navigasi data Economy" className="min-w-0"><div className="space-y-4 lg:sticky lg:top-28"><section className="rounded-2xl border border-white/10 bg-[#08172a] p-4 shadow-[0_14px_38px_rgba(0,0,0,.2)]"><div className="flex items-center gap-2"><Database aria-hidden="true" className="size-5 text-brand-cyan" /><div><h2 className="text-xl text-white">Data Economy</h2><p className="mt-1 hidden text-xs leading-5 text-[#8292a6] xl:block">Pusat data ekonomi pertambangan Indonesia.</p></div></div><div role="tablist" aria-label="Bagian Economy" className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">{sectionItems.map(({ id, label, description, icon: Icon }) => { const active = activeSection === id; return <button key={id} id={`economy-section-${id}`} type="button" role="tab" aria-selected={active} aria-controls={`economy-panel-${id}`} tabIndex={active ? 0 : -1} onClick={() => onSelect(id)} onKeyDown={(event) => handleKeyDown(event, id)} className={cn("group flex min-h-12 shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-[background-color,border-color,box-shadow,color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan motion-reduce:transform-none motion-reduce:transition-none lg:w-full", active ? "border-brand-cyan bg-brand-cyan/10 shadow-[0_0_24px_rgba(0,177,196,.12)]" : "border-transparent hover:-translate-y-0.5 hover:border-brand-cyan/35 hover:bg-brand-cyan/5")}><Icon aria-hidden="true" className={cn("size-[18px] shrink-0 transition-colors", active ? "text-brand-cyan" : "text-[#7f90a5] group-hover:text-brand-cyan")} /><span><span className={cn("block text-sm font-bold", active ? "text-white" : "text-[#c4ced9] group-hover:text-white")}>{label}</span><span className="hidden text-[11px] text-[#718196] xl:block">{description}</span></span></button>; })}</div></section><section className="relative hidden overflow-hidden rounded-2xl border border-brand-cyan/25 bg-[#08172a] p-4 lg:block"><div aria-hidden="true" className="absolute -right-14 -top-16 size-36 rounded-full bg-brand-cyan/10 blur-3xl" /><div className="relative flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/5"><Bot aria-hidden="true" className="size-5 text-brand-cyan" /></span><div><h2 className="text-lg leading-6 text-white">Perlu bantuan membaca data?</h2><p className="mt-2 text-xs leading-5 text-[#8fa0b4]">Baca cakupan MineBot sebelum fitur AI diaktifkan.</p></div></div><Link href={publicRoutes.mineBot} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,var(--brand-blue),var(--brand-cyan),var(--brand-teal))] px-4 text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan">Informasi MineBot<ArrowRight aria-hidden="true" className="size-4" /></Link></section></div></aside>;
}

export function EconomyDashboard({ dashboard, initialSection = "gdp" }: { dashboard: PublicEconomyDashboard; initialSection?: EconomySection }) {
  const [activeSection, setActiveSection] = useState(initialSection);
  useEffect(() => { const handlePopState = () => setActiveSection(resolveEconomySection(new URL(window.location.href).searchParams.get("section"))); window.addEventListener("popstate", handlePopState); return () => window.removeEventListener("popstate", handlePopState); }, []);
  function selectSection(section: EconomySection) { setActiveSection(section); const url = new URL(window.location.href); if (section === "gdp") url.searchParams.delete("section"); else url.searchParams.set("section", section); window.history.pushState({}, "", url); }
  return <div className="grid min-w-0 gap-7 lg:grid-cols-[270px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]"><EconomySidebar activeSection={activeSection} onSelect={selectSection} /><div id={`economy-panel-${activeSection}`} role="tabpanel" aria-labelledby={`economy-section-${activeSection}`} className="economy-section-transition min-w-0"><span className="sr-only">Bagian aktif: {sectionItems.find((item) => item.id === activeSection)?.label}</span>{activeSection === "gdp" ? <GdpSection records={dashboard.gdp} /> : null}{activeSection === "exports" ? <ExportSection records={dashboard.exports} /> : null}{activeSection === "investment" ? <InvestmentSection records={dashboard.investment} /> : null}{activeSection === "downstream" ? <DownstreamSection dashboard={dashboard} /> : null}{activeSection === "regulations" ? <RegulationsSection regulations={dashboard.regulations} /> : null}<section className="mt-6 rounded-2xl border border-brand-cyan/20 bg-[linear-gradient(110deg,rgba(40,103,228,.12),rgba(0,177,196,.1),rgba(60,195,171,.08))] p-5 lg:hidden"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/5"><Bot aria-hidden="true" className="size-5 text-brand-cyan" /></span><div><h2 className="text-lg text-white">Informasi MineBot</h2><p className="mt-2 text-sm leading-6 text-[#9facba]">Baca cakupan MineBot sebelum fitur AI diaktifkan.</p></div></div><Link href={publicRoutes.mineBot} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(90deg,var(--brand-blue),var(--brand-cyan),var(--brand-teal))] px-5 text-sm font-bold text-white">Informasi MineBot</Link></section></div></div>;
}
