import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const OUTPUT_PATH = resolve(
  "data",
  "staging",
  "industry",
  "company-foundation.json",
);

const years = [2023, 2024, 2025];

const sourceDefinitions = [
  ["alamtri-resources", "AlamTri Annual Reports", "PT Alamtri Resources Indonesia Tbk", "https://www.alamtri.com/pages/read/10/42/Laporan%20Tahunan"],
  ["bayan-resources", "Bayan Resources Annual Reports", "PT Bayan Resources Tbk", "https://www.bayan.com.sg/annual-reports"],
  ["amman-mineral", "AMMAN Investor Reports", "PT Amman Mineral Internasional Tbk", "https://www.amman.co.id/investor"],
  ["antam", "ANTAM Annual Reports", "PT Aneka Tambang Tbk", "https://www.antam.com/en/reports/annual-report"],
  ["bukit-asam", "Bukit Asam Annual Reports", "PT Bukit Asam Tbk", "https://www.ptba.co.id/en/investor/annual-report"],
  ["bumi-resources", "Bumi Resources Annual Reports", "PT Bumi Resources Tbk", "https://www.bumiresources.com/investor-relations/annual-report-and-sustainabilty-report"],
  ["freeport-indonesia", "Freeport-McMoRan Annual Reports", "Freeport-McMoRan Inc.", "https://investors.fcx.com/investors/financial-information/annual-reports-and-proxy/default.aspx"],
  ["trimegah-bangun-persada", "Harita Nickel Annual Reports", "PT Trimegah Bangun Persada Tbk", "https://tbpnickel.com/en/annual-report-2025"],
  ["harum-energy", "Harum Energy Annual Reports", "PT Harum Energy Tbk", "https://www.harumenergy.com/investor-relations/annual-report"],
  ["merdeka-copper-gold", "Merdeka Copper Gold Annual Reports", "PT Merdeka Copper Gold Tbk", "https://merdekacoppergold.com/en/investors/reports/"],
  ["timah", "TIMAH Annual Reports", "PT TIMAH Tbk", "https://timah.com/investor-relations/annual-report.html"],
  ["vale-indonesia", "Vale Indonesia Reports", "PT Vale Indonesia Tbk", "https://www.vale.com/indonesia/documents-and-reports"],
].map(([companySlug, name, organization, url]) => ({
  companySlug,
  slug: `industry-${companySlug}-reports`,
  name,
  organization,
  type: "company_report",
  url,
  description: `Portal laporan resmi ${organization} untuk data produksi, keuangan, dan wilayah operasi.`,
  isOfficial: true,
  verificationStatus: "verified",
  isActive: true,
}));

const sourceByCompany = new Map(
  sourceDefinitions.map((source) => [source.companySlug, source]),
);

function multiplyDecimal(value, scale) {
  const normalized = String(value).replace(",", ".");
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [integerPart, decimalPart = ""] = unsigned.split(".");
  const denominator = 10n ** BigInt(decimalPart.length);
  const numerator = BigInt(`${integerPart}${decimalPart}` || "0");
  const scaled = numerator * BigInt(scale);

  if (scaled % denominator !== 0n) {
    throw new Error(`Normalisasi tidak menghasilkan bilangan eksak: ${value} × ${scale}`);
  }

  const result = scaled / denominator;
  return `${negative ? "-" : ""}${result}`;
}

const production = [];

function addProductionSeries({
  companySlug,
  commoditySlug,
  metricCode,
  metricName,
  productName,
  reportedValues,
  valueScale,
  unitCode,
  reportedUnitLabel,
  productionBasis,
  notes = null,
}) {
  const source = sourceByCompany.get(companySlug);

  years.forEach((year, index) => {
    const item = reportedValues[index];
    const unavailable = typeof item === "object" && item !== null;
    const availability = unavailable ? item.availability : "reported";
    const reportedValue = unavailable ? null : String(item);

    production.push({
      companySlug,
      commoditySlug,
      year,
      metricCode,
      metricName,
      productName,
      productionValue:
        availability === "reported"
          ? multiplyDecimal(reportedValue, valueScale)
          : null,
      unitCode: availability === "reported" ? unitCode : null,
      reportedValue,
      valueScale: availability === "reported" ? valueScale : null,
      reportedUnitLabel,
      productionBasis,
      dataAvailability: availability,
      recordType: "actual",
      sourceSlug: source.slug,
      sourceReportYear: year,
      sourceUrl: source.url,
      pageReference: null,
      verificationStatus:
        availability === "reported" ? "verified" : "pending",
      publicationStatus:
        availability === "reported" ? "published" : "draft",
      notes: unavailable ? item.notes : notes,
    });
  });
}

addProductionSeries({ companySlug: "alamtri-resources", commoditySlug: "batubara", metricCode: "metallurgical_coal_production", metricName: "Produksi batubara metalurgi", productName: "Batubara metalurgi", reportedValues: ["5.10", "6.63", "7.41"], valueScale: 1_000_000, unitCode: "metric_ton", reportedUnitLabel: "juta ton", productionBasis: "Produksi batubara metalurgi grup; bukan penjualan." });
addProductionSeries({ companySlug: "bayan-resources", commoditySlug: "batubara", metricCode: "thermal_coal_production", metricName: "Produksi batubara", productName: "Batubara termal", reportedValues: ["49.7", "56.9", "68.0"], valueScale: 1_000_000, unitCode: "metric_ton", reportedUnitLabel: "juta ton", productionBasis: "Produksi batubara grup; bukan penjualan." });
addProductionSeries({ companySlug: "amman-mineral", commoditySlug: "tembaga", metricCode: "copper_production", metricName: "Produksi tembaga", productName: "Tembaga", reportedValues: [311, 395, 209], valueScale: 1_000_000, unitCode: "pound", reportedUnitLabel: "juta pon", productionBasis: "Produksi pada operasi AMMAN; tembaga dipisahkan dari emas." });
addProductionSeries({ companySlug: "amman-mineral", commoditySlug: "emas", metricCode: "gold_production", metricName: "Produksi emas", productName: "Emas", reportedValues: [464, 803, 103], valueScale: 1_000, unitCode: "troy_ounce", reportedUnitLabel: "ribu ons troy", productionBasis: "Produksi pada operasi AMMAN; emas dipisahkan dari tembaga." });
addProductionSeries({ companySlug: "antam", commoditySlug: "nikel", metricCode: "nickel_ore_production", metricName: "Produksi bijih nikel", productName: "Bijih nikel", reportedValues: ["13.45", "9.94", "16.11"], valueScale: 1_000_000, unitCode: "wet_metric_ton", reportedUnitLabel: "juta wmt", productionBasis: "Produksi bijih nikel dalam wet metric ton." });
addProductionSeries({ companySlug: "antam", commoditySlug: "nikel", metricCode: "ferronickel_contained_nickel_production", metricName: "Produksi feronikel", productName: "Nikel terkandung dalam feronikel", reportedValues: [21473, 20103, 16064], valueScale: 1, unitCode: "metric_ton", reportedUnitLabel: "ton Ni dalam FeNi", productionBasis: "Kandungan nikel dalam feronikel; tidak dijumlahkan dengan bijih nikel." });
addProductionSeries({ companySlug: "antam", commoditySlug: "emas", metricCode: "mined_gold_production", metricName: "Produksi emas tambang", productName: "Emas tambang", reportedValues: [1210, 1019, 743], valueScale: 1, unitCode: "kilogram", reportedUnitLabel: "kg", productionBasis: "Produksi emas tambang dalam kilogram." });
addProductionSeries({ companySlug: "antam", commoditySlug: "bauksit", metricCode: "bauxite_ore_production", metricName: "Produksi bauksit", productName: "Bijih bauksit", reportedValues: ["2.01", "1.33", "2.83"], valueScale: 1_000_000, unitCode: "wet_metric_ton", reportedUnitLabel: "juta wmt", productionBasis: "Produksi bijih bauksit dalam wet metric ton." });
addProductionSeries({ companySlug: "bukit-asam", commoditySlug: "batubara", metricCode: "coal_production", metricName: "Produksi batubara", productName: "Batubara", reportedValues: ["41.9", "43.3", "47.19"], valueScale: 1_000_000, unitCode: "metric_ton", reportedUnitLabel: "juta ton", productionBasis: "Produksi batubara PTBA; bukan penjualan." });
addProductionSeries({ companySlug: "bumi-resources", commoditySlug: "batubara", metricCode: "kpc_arutmin_coal_production", metricName: "Produksi batubara KPC dan Arutmin", productName: "Batubara KPC + Arutmin", reportedValues: ["77.8", "74.7", "74.9"], valueScale: 1_000_000, unitCode: "metric_ton", reportedUnitLabel: "juta ton", productionBasis: "Gabungan produksi operator KPC dan Arutmin; bukan penjualan." });
addProductionSeries({ companySlug: "freeport-indonesia", commoditySlug: "tembaga", metricCode: "indonesia_copper_production_100pct", metricName: "Produksi tembaga operasi Indonesia", productName: "Tembaga", reportedValues: [1660, 1800, 1015], valueScale: 1_000_000, unitCode: "pound", reportedUnitLabel: "juta pon", productionBasis: "Basis 100% operasi Indonesia, bukan attributable share." });
addProductionSeries({ companySlug: "freeport-indonesia", commoditySlug: "emas", metricCode: "indonesia_gold_production_100pct", metricName: "Produksi emas operasi Indonesia", productName: "Emas", reportedValues: [1978, 1861, 937], valueScale: 1_000, unitCode: "troy_ounce", reportedUnitLabel: "ribu ons troy", productionBasis: "Basis 100% operasi Indonesia, bukan attributable share." });
addProductionSeries({ companySlug: "trimegah-bangun-persada", commoditySlug: "nikel", metricCode: "saprolite_ore_production", metricName: "Produksi bijih saprolit", productName: "Bijih saprolit", reportedValues: [6092353, { availability: "not_normalized", notes: "Sumber resmi tersedia, tetapi angka 2024 belum dinormalisasi." }, { availability: "not_normalized", notes: "Sumber resmi tersedia, tetapi angka 2025 belum dinormalisasi." }], valueScale: 1, unitCode: "wet_metric_ton", reportedUnitLabel: "wmt", productionBasis: "Produksi bijih saprolit; dipisahkan dari limonit dan produk olahan." });
addProductionSeries({ companySlug: "trimegah-bangun-persada", commoditySlug: "nikel", metricCode: "limonite_ore_production", metricName: "Produksi bijih limonit", productName: "Bijih limonit", reportedValues: [14661144, { availability: "not_normalized", notes: "Sumber resmi tersedia, tetapi angka 2024 belum dinormalisasi." }, { availability: "not_normalized", notes: "Sumber resmi tersedia, tetapi angka 2025 belum dinormalisasi." }], valueScale: 1, unitCode: "wet_metric_ton", reportedUnitLabel: "wmt", productionBasis: "Produksi bijih limonit; dipisahkan dari saprolit dan produk olahan." });
addProductionSeries({ companySlug: "trimegah-bangun-persada", commoditySlug: "nikel", metricCode: "ferronickel_contained_nickel_production", metricName: "Produksi feronikel", productName: "Nikel terkandung dalam feronikel", reportedValues: [101538, { availability: "not_reported", notes: "Dokumen revisi menampilkan tanda '-' untuk 2024." }, { availability: "not_reported", notes: "Dokumen revisi menampilkan tanda '-' untuk 2025." }], valueScale: 1, unitCode: "metric_ton", reportedUnitLabel: "ton Ni dalam FeNi", productionBasis: "Kandungan nikel dalam feronikel; tidak dijumlahkan dengan bijih." });
addProductionSeries({ companySlug: "harum-energy", commoditySlug: "batubara", metricCode: "coal_production", metricName: "Produksi batubara", productName: "Batubara", reportedValues: [6955140, 6128681, 4610836], valueScale: 1, unitCode: "metric_ton", reportedUnitLabel: "ton", productionBasis: "Produksi batubara dalam ton penuh.", notes: "Label 'juta ton' pada dokumen revisi tidak konsisten dengan angka; angka dinormalisasi sebagai ton penuh." });
addProductionSeries({ companySlug: "harum-energy", commoditySlug: "nikel", metricCode: "contained_nickel_metal_production", metricName: "Produksi nikel metal", productName: "Nikel terkandung", reportedValues: [28789, 56998, 74822], valueScale: 1, unitCode: "metric_ton", reportedUnitLabel: "ton Ni", productionBasis: "Nikel terkandung dalam produk operasi nikel; dipisahkan dari bijih." });
addProductionSeries({ companySlug: "merdeka-copper-gold", commoditySlug: "emas", metricCode: "gold_production", metricName: "Produksi emas", productName: "Emas", reportedValues: [138666, 115867, 103156], valueScale: 1, unitCode: "troy_ounce", reportedUnitLabel: "ons troy", productionBasis: "Produksi emas; dipisahkan dari tembaga dan produk nikel." });
addProductionSeries({ companySlug: "merdeka-copper-gold", commoditySlug: "tembaga", metricCode: "copper_production", metricName: "Produksi tembaga", productName: "Tembaga", reportedValues: [12706, 13902, 10454], valueScale: 1, unitCode: "metric_ton", reportedUnitLabel: "ton", productionBasis: "Produksi tembaga; dipisahkan dari emas dan produk nikel." });
addProductionSeries({ companySlug: "merdeka-copper-gold", commoditySlug: "nikel", metricCode: "npi_contained_nickel_production", metricName: "Produksi nikel dalam NPI", productName: "Nikel terkandung dalam NPI", reportedValues: [65117, 82161, 73871], valueScale: 1, unitCode: "metric_ton", reportedUnitLabel: "ton Ni", productionBasis: "Kandungan nikel dalam NPI; tidak dijumlahkan dengan matte." });
addProductionSeries({ companySlug: "merdeka-copper-gold", commoditySlug: "nikel", metricCode: "matte_contained_nickel_production", metricName: "Produksi nikel dalam matte", productName: "Nikel terkandung dalam matte", reportedValues: [30333, 50315, 19998], valueScale: 1, unitCode: "metric_ton", reportedUnitLabel: "ton Ni", productionBasis: "Kandungan nikel dalam matte; tidak dijumlahkan dengan NPI." });
addProductionSeries({ companySlug: "timah", commoditySlug: "timah", metricCode: "tin_ore_contained_tin_production", metricName: "Produksi bijih timah", productName: "Timah terkandung dalam bijih", reportedValues: [14855, 19437, 18635], valueScale: 1, unitCode: "metric_ton", reportedUnitLabel: "ton Sn", productionBasis: "Kandungan timah dalam bijih; dipisahkan dari logam timah." });
addProductionSeries({ companySlug: "timah", commoditySlug: "timah", metricCode: "refined_tin_production", metricName: "Produksi logam timah", productName: "Logam timah", reportedValues: [15340, 18915, 17815], valueScale: 1, unitCode: "metric_ton", reportedUnitLabel: "metrik ton", productionBasis: "Produksi logam timah; dipisahkan dari bijih timah." });
addProductionSeries({ companySlug: "timah", commoditySlug: "batubara", metricCode: "coal_production", metricName: "Produksi batubara", productName: "Batubara", reportedValues: [438483, 394771, 89914], valueScale: 1, unitCode: "metric_ton", reportedUnitLabel: "ton", productionBasis: "Produksi batubara dilaporkan terpisah dari bisnis timah." });
addProductionSeries({ companySlug: "vale-indonesia", commoditySlug: "nikel", metricCode: "nickel_matte_contained_nickel_production", metricName: "Produksi nikel matte", productName: "Nikel terkandung dalam matte", reportedValues: [70728, 71311, 72027], valueScale: 1, unitCode: "metric_ton", reportedUnitLabel: "ton Ni", productionBasis: "Kandungan nikel dalam matte dari operasi Vale Indonesia." });

const financials = [];

function addFinancialSeries({ companySlug, currencyCode, valueScale, reportedUnitLabel, statementScope, metrics }) {
  const source = sourceByCompany.get(companySlug);
  for (const metricDefinition of metrics) {
    years.forEach((year, index) => {
      const reportedValue = String(metricDefinition.values[index]);
      financials.push({
        companySlug,
        year,
        metric: metricDefinition.metric,
        metricLabel: metricDefinition.label,
        amount: multiplyDecimal(reportedValue, metricDefinition.scales?.[index] ?? valueScale),
        currencyCode,
        reportedValue,
        valueScale: metricDefinition.scales?.[index] ?? valueScale,
        reportedUnitLabel: metricDefinition.units?.[index] ?? reportedUnitLabel,
        statementScope,
        profitDefinition: metricDefinition.profitDefinition ?? null,
        auditStatus: "audited",
        sourceSlug: source.slug,
        sourceReportYear: year,
        sourceUrl: source.url,
        pageReference: null,
        verificationStatus: "verified",
        publicationStatus: "published",
        notes: metricDefinition.notes?.[index] ?? null,
      });
    });
  }
}

const standardMetrics = (assets, revenue, earnings, earningsMetric = "net_income", earningsLabel = "Laba bersih", profitDefinition = "Laba bersih sesuai definisi laporan perusahaan.") => [
  { metric: "total_assets", label: "Total aset", values: assets },
  { metric: "revenue", label: "Pendapatan", values: revenue },
  { metric: earningsMetric, label: earningsLabel, values: earnings, profitDefinition },
];

addFinancialSeries({ companySlug: "alamtri-resources", currencyCode: "USD", valueScale: 1_000_000, reportedUnitLabel: "US$ juta", statementScope: "Konsolidasian", metrics: standardMetrics([10473, 6702, 6817], [2135, 2079, 1874], [653, 637, 490]) });
addFinancialSeries({ companySlug: "bayan-resources", currencyCode: "USD", valueScale: 1_000_000, reportedUnitLabel: "US$ juta", statementScope: "Konsolidasian", metrics: standardMetrics([3444, 3521, 3375], [3581, 3446, 3428], [1280, 943, 784]) });
addFinancialSeries({ companySlug: "amman-mineral", currencyCode: "USD", valueScale: 1_000_000, reportedUnitLabel: "US$ juta", statementScope: "Konsolidasian PT Amman Mineral Internasional Tbk", metrics: standardMetrics([9100, 11120, 13870], [2033, 2664, 1847], [259, 642, 258]) });
addFinancialSeries({ companySlug: "antam", currencyCode: "IDR", valueScale: 1_000_000_000_000, reportedUnitLabel: "Rp triliun", statementScope: "Konsolidasian", metrics: standardMetrics(["42.85", "44.52", "52.53"], ["41.05", "69.19", "84.64"], ["3.08", "3.85", "7.92"]) });
addFinancialSeries({ companySlug: "bukit-asam", currencyCode: "IDR", valueScale: 1_000_000_000_000, reportedUnitLabel: "Rp triliun", statementScope: "Konsolidasian", metrics: standardMetrics(["38.77", "41.79", "43.92"], ["38.49", "42.76", "42.65"], ["6.29", "5.10", "2.93"]) });
addFinancialSeries({ companySlug: "bumi-resources", currencyCode: "USD", valueScale: 1_000_000, reportedUnitLabel: "US$ juta", statementScope: "Konsolidasian", metrics: standardMetrics([4203, 4163, 4129], [1680, 1360, 1424], ["26.9", "90.1", "122.3"]) });
addFinancialSeries({ companySlug: "freeport-indonesia", currencyCode: "USD", valueScale: 1_000_000, reportedUnitLabel: "US$ juta", statementScope: "Segmen Indonesia Freeport-McMoRan; basis 100% segmen", metrics: standardMetrics([25548, 27309, 27270], [8437, 10318, 8622], [4708, 5622, 3840], "operating_income", "Laba operasi segmen Indonesia", "Laba operasi segmen Indonesia, bukan laba bersih PT Freeport Indonesia.") });
addFinancialSeries({ companySlug: "trimegah-bangun-persada", currencyCode: "IDR", valueScale: 1_000_000_000_000, reportedUnitLabel: "Rp triliun", statementScope: "Konsolidasian", metrics: standardMetrics(["45.3", "52.25", "61.77"], ["23.85", "26.96", "29.63"], ["7.06", "7.71", "10.97"]) });
addFinancialSeries({ companySlug: "harum-energy", currencyCode: "USD", valueScale: 1, reportedUnitLabel: "US$", statementScope: "Konsolidasian", metrics: standardMetrics([1633107192, 2574539092, 3437267772], [925520340, 1295465928, 1338626499], [195672112, 77659731, 45322468], "profit_for_year", "Laba tahun berjalan", "Laba tahun berjalan konsolidasian.") });
addFinancialSeries({ companySlug: "merdeka-copper-gold", currencyCode: "USD", valueScale: 1_000_000, reportedUnitLabel: "US$ juta", statementScope: "Konsolidasian", metrics: standardMetrics([4964, 5237, 5707], [1706, 2239, 1894], ["5.7", "9.8", "16.2"], "profit_for_year", "Laba tahun berjalan", "Laba tahun berjalan konsolidasian.") });
addFinancialSeries({ companySlug: "timah", currencyCode: "IDR", valueScale: 1_000_000_000_000, reportedUnitLabel: "Rp triliun", statementScope: "Konsolidasian", metrics: [
  { metric: "total_assets", label: "Total aset", values: ["12.83", "12.78", "13.64"] },
  { metric: "revenue", label: "Pendapatan", values: ["8.39", "10.85", "11.55"] },
  { metric: "profit_for_year", label: "Laba (rugi) tahun berjalan", values: ["-449.67", "1.24", "1.31"], scales: [1_000_000_000, 1_000_000_000_000, 1_000_000_000_000], units: ["Rp miliar", "Rp triliun", "Rp triliun"], profitDefinition: "Laba (rugi) tahun berjalan konsolidasian.", notes: ["Koreksi dokumen revisi: 2023 adalah rugi Rp449,67 miliar, bukan laba Rp449 triliun.", null, null] },
] });
addFinancialSeries({ companySlug: "vale-indonesia", currencyCode: "USD", valueScale: 1_000, reportedUnitLabel: "US$ ribuan", statementScope: "Konsolidasian", metrics: standardMetrics([2925999, 3176528, 3345847], [1232263, 950388, 990195], [274334, 57761, 76063]) });

const siteRows = [
  ["alamtri-resources", "Maruwai Coal", "PT Maruwai Coal", "mine", "operating", "Operasi", ["batubara"], "Kalimantan Tengah", null, "Kalimantan Tengah"],
  ["alamtri-resources", "Lahai Coal", "PT Lahai Coal", "mine", "operating", "Operasi", ["batubara"], "Kalimantan Tengah", null, "Kalimantan Tengah"],
  ["alamtri-resources", "Juloi, Kalteng, Sumber Barito", "Anak usaha AMI", "project", "development", "Pengembangan", ["batubara"], "Kalimantan Tengah dan Kalimantan Timur", null, "Kalimantan Tengah/Timur"],
  ["bayan-resources", "Tabang/Pakar", "Anak usaha Bayan", "mine", "operating", "Operasi", ["batubara"], "Kalimantan Timur", "Kutai Kartanegara dan Kutai Timur", "Kutai Kartanegara & Kutai Timur, Kalimantan Timur"],
  ["bayan-resources", "Wahana Baratama", "PT Wahana Baratama Mining", "mine", "operating", "Operasi", ["batubara"], "Kalimantan Selatan", null, "Kalimantan Selatan"],
  ["bayan-resources", "Perkasa Inakakerta", "PT Perkasa Inakakerta", "mine", "operating", "Operasi", ["batubara"], "Kalimantan Timur", null, "Kalimantan Timur"],
  ["amman-mineral", "Tambang Batu Hijau", "PT AMNT", "mine", "operating", "Operasi", ["tembaga", "emas"], "Nusa Tenggara Barat", "Sumbawa Barat", "Sumbawa Barat, Nusa Tenggara Barat"],
  ["amman-mineral", "Deposit Elang", "PT AMNT", "project", "development", "Pengembangan", ["tembaga", "emas"], "Nusa Tenggara Barat", "Sumbawa Barat", "Sumbawa Barat, Nusa Tenggara Barat"],
  ["amman-mineral", "Smelter Benete", "PT AMIN", "smelter", "ramp_up", "Operasi/ramp-up", ["tembaga"], "Nusa Tenggara Barat", "Sumbawa Barat", "Sumbawa Barat, Nusa Tenggara Barat"],
  ["antam", "UBP Nikel Kolaka", "ANTAM", "mine", "operating", "Operasi", ["nikel"], "Sulawesi Tenggara", "Kolaka", "Pomalaa, Kolaka, Sulawesi Tenggara"],
  ["antam", "UBP Nikel Maluku Utara", "ANTAM", "mine", "operating", "Operasi", ["nikel"], "Maluku Utara", "Halmahera Timur", "Halmahera Timur, Maluku Utara"],
  ["antam", "UBP Emas", "ANTAM", "mine", "operating", "Operasi", ["emas"], "Jawa Barat", "Bogor", "Pongkor, Bogor, Jawa Barat"],
  ["antam", "UBP Bauksit Kalimantan Barat", "ANTAM", "mine", "operating", "Operasi", ["bauksit"], "Kalimantan Barat", "Sanggau", "Tayan, Sanggau, Kalimantan Barat"],
  ["bukit-asam", "Tanjung Enim", "PTBA", "mine", "operating", "Operasi", ["batubara"], "Sumatera Selatan", "Muara Enim", "Muara Enim, Sumatera Selatan"],
  ["bukit-asam", "Peranap", "PTBA", "mine", "limited_operation", "Pengembangan/operasi terbatas", ["batubara"], "Riau", "Indragiri Hulu", "Indragiri Hulu, Riau"],
  ["bukit-asam", "IPC", "PT International Prima Coal", "mine", "operating", "Operasi", ["batubara"], "Kalimantan Timur", "Samarinda", "Samarinda, Kalimantan Timur"],
  ["bumi-resources", "Sangatta & Bengalon (KPC)", "PT Kaltim Prima Coal", "operating_area", "operating", "Operasi", ["batubara"], "Kalimantan Timur", "Kutai Timur", "Sangatta dan Bengalon, Kutai Timur, Kalimantan Timur"],
  ["bumi-resources", "Senakin, Satui, Batulicin, Asam-asam, Kintap", "PT Arutmin Indonesia", "operating_area", "operating", "Operasi", ["batubara"], "Kalimantan Selatan", null, "Kalimantan Selatan"],
  ["bumi-resources", "Pendopo", "PT Pendopo Energi Batubara", "project", "development", "Pengembangan", ["batubara"], "Sumatera Selatan", null, "Sumatera Selatan"],
  ["freeport-indonesia", "Grasberg Block Cave", "PTFI", "underground_mine", "operating", "Operasi bawah tanah", ["tembaga", "emas"], "Papua Tengah", "Mimika", "Mimika, Papua Tengah"],
  ["freeport-indonesia", "Deep Mill Level Zone", "PTFI", "underground_mine", "operating", "Operasi bawah tanah", ["tembaga", "emas"], "Papua Tengah", "Mimika", "Mimika, Papua Tengah"],
  ["freeport-indonesia", "Big Gossan", "PTFI", "underground_mine", "operating", "Operasi bawah tanah", ["tembaga", "emas"], "Papua Tengah", "Mimika", "Mimika, Papua Tengah"],
  ["freeport-indonesia", "Smelter Manyar", "PTFI", "smelter", "ramp_up", "Operasi/ramp-up", ["tembaga"], "Jawa Timur", "Gresik", "Manyar, Gresik, Jawa Timur"],
  ["trimegah-bangun-persada", "Tambang TBP", "PT TBP", "mine", "operating", "Operasi", ["nikel"], "Maluku Utara", "Halmahera Selatan", "Pulau Obi, Halmahera Selatan, Maluku Utara"],
  ["trimegah-bangun-persada", "Kawasan industri Obi", "Anak usaha/ventura Harita Nickel", "industrial_complex", "operating", "Operasi", ["nikel"], "Maluku Utara", "Halmahera Selatan", "Pulau Obi, Halmahera Selatan, Maluku Utara"],
  ["harum-energy", "MSJ/Santan/KUP/BKP", "Anak usaha HRUM", "operating_area", "operating", "Operasi", ["batubara"], "Kalimantan Timur", null, "Kalimantan Timur"],
  ["harum-energy", "PT Position", "PT Position", "mine", "operating", "Operasi", ["nikel"], "Maluku Utara", "Halmahera Tengah", "Halmahera Tengah, Maluku Utara"],
  ["harum-energy", "IMI/WMI/BSE", "Anak usaha HRUM", "industrial_complex", "development", "Operasi/pengembangan", ["nikel"], "Maluku Utara", "Halmahera Tengah", "Indonesia Weda Bay Industrial Park, Maluku Utara"],
  ["merdeka-copper-gold", "Tujuh Bukit Gold", "PT Bumi Suksesindo", "mine", "operating", "Operasi", ["emas"], "Jawa Timur", "Banyuwangi", "Banyuwangi, Jawa Timur"],
  ["merdeka-copper-gold", "Wetar Copper", "BKP/BTR", "mine", "operating", "Operasi", ["tembaga"], "Maluku", "Maluku Barat Daya", "Maluku Barat Daya"],
  ["merdeka-copper-gold", "Pani Gold", "PT Pani Bersama Jaya", "project", "construction", "Konstruksi/pengembangan", ["emas"], "Gorontalo", "Pohuwato", "Pohuwato, Gorontalo"],
  ["merdeka-copper-gold", "Sulawesi Cahaya Mineral", "Entitas MBMA", "mine", "development", "Pengembangan/operasi", ["nikel"], "Sulawesi Tenggara", "Konawe", "Konawe, Sulawesi Tenggara"],
  ["timah", "Bangka", "PT TIMAH Tbk", "operating_area", "operating", "Operasi darat & laut", ["timah"], "Kepulauan Bangka Belitung", null, "Pulau Bangka, Kepulauan Bangka Belitung"],
  ["timah", "Belitung", "PT TIMAH Tbk", "operating_area", "operating", "Operasi", ["timah"], "Kepulauan Bangka Belitung", null, "Pulau Belitung, Kepulauan Bangka Belitung"],
  ["timah", "Kundur", "PT TIMAH Tbk", "operating_area", "operating", "Operasi", ["timah"], "Kepulauan Riau", "Karimun", "Kundur, Karimun, Kepulauan Riau"],
  ["timah", "Muntok", "PT TIMAH Tbk", "smelter", "operating", "Peleburan", ["timah"], "Kepulauan Bangka Belitung", "Bangka Barat", "Muntok, Bangka Barat"],
  ["vale-indonesia", "Sorowako", "PT Vale Indonesia", "mine", "operating", "Operasi", ["nikel"], "Sulawesi Selatan", "Luwu Timur", "Sorowako, Luwu Timur, Sulawesi Selatan"],
  ["vale-indonesia", "Pomalaa", "PT Vale Indonesia/mitra", "project", "development", "Pengembangan", ["nikel"], "Sulawesi Tenggara", "Kolaka", "Pomalaa, Kolaka, Sulawesi Tenggara"],
  ["vale-indonesia", "Bahodopi", "PT Vale Indonesia/mitra", "project", "development", "Pengembangan", ["nikel"], "Sulawesi Tengah", "Morowali", "Bahodopi, Morowali, Sulawesi Tengah"],
];

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const operationSites = siteRows.map((row, index) => {
  const [companySlug, name, operatorName, siteType, currentStatus, statusLabel, commoditySlugs, provinceName, regencyName, locationDescription] = row;
  const source = sourceByCompany.get(companySlug);
  return {
    companySlug,
    name,
    slug: slugify(name),
    operatorName,
    siteType,
    currentStatus,
    statusLabel,
    commoditySlugs,
    provinceName,
    regencyName,
    locationDescription,
    latitude: null,
    longitude: null,
    coordinatePrecision: null,
    displayOrder: index + 1,
    isActive: true,
    sourceSlug: source.slug,
    sourceReportYear: 2025,
    sourceUrl: source.url,
    pageReference: null,
    verificationStatus: "pending",
    publicationStatus: "draft",
    notes: "Koordinat aset wajib diverifikasi dari sumber berlisensi sebelum dipublikasikan pada peta.",
  };
});

const manifest = {
  schemaVersion: 1,
  generatedFrom: "2. Industri Pertambangan - Revisi Terverifikasi(3).docx",
  normalization: {
    production: "Nilai dasar disimpan dalam unit fisik tanpa awalan juta/ribu; jenis produk tidak digabung.",
    financials: "Nilai dasar disimpan dalam mata uang laporan (USD/IDR); reportedValue, valueScale, dan label asli dipertahankan.",
    operationSites: "Seluruh koordinat kosong dan status draft/pending sampai verifikasi geospasial selesai.",
  },
  counts: {
    sources: sourceDefinitions.length,
    production: production.length,
    reportedProduction: production.filter((record) => record.dataAvailability === "reported").length,
    financials: financials.length,
    operationSites: operationSites.length,
  },
  sources: sourceDefinitions,
  production,
  financials,
  operationSites,
};

if (manifest.counts.sources !== 12 || manifest.counts.production !== 75 || manifest.counts.reportedProduction !== 69 || manifest.counts.financials !== 108 || manifest.counts.operationSites !== 39) {
  throw new Error(`Jumlah record tidak sesuai: ${JSON.stringify(manifest.counts)}`);
}

await mkdir(resolve("data", "staging", "industry"), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Manifest berhasil dibuat: ${OUTPUT_PATH}`);
console.log(JSON.stringify(manifest.counts, null, 2));
