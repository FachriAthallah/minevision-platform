export type PriceStandardSeed = {
  commoditySlug: string;
  issuingSourceSlug: string;
  code: string;
  name: string;
  description: string;
  methodology: string | null;
  defaultCurrencyCode: string;
  defaultUnitCode: string;
  isActive: boolean;
};

export const priceStandardSeed: PriceStandardSeed[] = [
  {
    commoditySlug: "batubara",
    issuingSourceSlug: "kementerian-esdm",
    code: "HBA_6322",
    name: "Harga Batubara Acuan 6.322 kcal/kg GAR",
    description:
      "Harga acuan batubara dengan spesifikasi 6.322 kcal/kg GAR yang ditetapkan oleh Kementerian ESDM.",
    methodology: null,
    defaultCurrencyCode: "USD",
    defaultUnitCode: "metric_ton",
    isActive: true,
  },
  {
    commoditySlug: "nikel",
    issuingSourceSlug: "kementerian-esdm",
    code: "HMA_NIKEL",
    name: "Harga Mineral Acuan Nikel",
    description:
      "Harga mineral acuan nikel yang diterbitkan oleh Kementerian ESDM.",
    methodology: null,
    defaultCurrencyCode: "USD",
    defaultUnitCode: "dry_metric_ton",
    isActive: true,
  },
  {
    commoditySlug: "tembaga",
    issuingSourceSlug: "kementerian-esdm",
    code: "HMA_TEMBAGA",
    name: "Harga Mineral Acuan Tembaga",
    description:
      "Harga mineral acuan tembaga yang diterbitkan oleh Kementerian ESDM.",
    methodology: null,
    defaultCurrencyCode: "USD",
    defaultUnitCode: "dry_metric_ton",
    isActive: true,
  },
  {
    commoditySlug: "emas",
    issuingSourceSlug: "kementerian-esdm",
    code: "HMA_EMAS",
    name: "Harga Mineral Acuan Emas",
    description:
      "Harga mineral acuan emas sebagai mineral ikutan yang diterbitkan oleh Kementerian ESDM.",
    methodology: null,
    defaultCurrencyCode: "USD",
    defaultUnitCode: "troy_ounce",
    isActive: true,
  },
  {
    commoditySlug: "bijih-besi",
    issuingSourceSlug: "kementerian-esdm",
    code: "HMA_BIJIH_BESI",
    name: "Harga Mineral Acuan Bijih Besi",
    description:
      "Harga mineral acuan bijih besi yang diterbitkan oleh Kementerian ESDM.",
    methodology: null,
    defaultCurrencyCode: "USD",
    defaultUnitCode: "dry_metric_ton",
    isActive: true,
  },
  {
    commoditySlug: "emas",
    issuingSourceSlug: "logam-mulia-antam",
    code: "ANTAM_GOLD_RETAIL",
    name: "Harga Emas Ritel Logam Mulia ANTAM",
    description:
      "Harga emas batangan ritel domestik yang dipublikasikan oleh Logam Mulia ANTAM.",
    methodology: null,
    defaultCurrencyCode: "IDR",
    defaultUnitCode: "gram",
    isActive: true,
  },
];
