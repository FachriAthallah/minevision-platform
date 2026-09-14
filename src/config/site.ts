export type NavigationItem = {
  label: string;
  href: string;
  external?: boolean;
};

export const publicRoutes = {
  home: "/",
  education: "/education",
  educationGlossary: "/education/istilah-pertambangan",
  industry: "/industry",
  industryOperations: "/industry?category=operations",
  commodity: "/commodity",
  career: "/career",
  careerCategories: "/career#kategori-karier",
  intelligence: "/intelligence",
  economy: "/economy",
  economyDownstream: "/economy?section=downstream",
  search: "/search",
  about: "/about",
  methodology: "/methodology",
  privacy: "/privacy",
  terms: "/terms",
  contact: "/contact",
  sources: "/sources",
  mineBot: "/about#minebot",
} as const;

export const officialSourceLinks = [
  { label: "Kementerian ESDM", href: "https://www.esdm.go.id/", external: true },
  { label: "Badan Pusat Statistik", href: "https://www.bps.go.id/id", external: true },
  { label: "Ditjen Minerba", href: "https://www.minerba.esdm.go.id/", external: true },
  { label: "Badan Geologi", href: "https://geologi.esdm.go.id/", external: true },
  { label: "JDIH ESDM", href: "https://jdih.esdm.go.id/", external: true },
  { label: "Daftar Sumber", href: publicRoutes.sources },
] satisfies NavigationItem[];

export const siteConfig = {
  name: "MineVision",
  fullName: "MineVision Intelligence Platform Indonesia",
  description:
    "Platform edukasi, industri, komoditas, karier, data intelligence, dan ekonomi sektor pertambangan Indonesia.",

  mainNavigation: [
    {
      label: "Home",
      href: publicRoutes.home,
    },
    {
      label: "Education",
      href: publicRoutes.education,
    },
    {
      label: "Industry",
      href: publicRoutes.industry,
    },
    {
      label: "Commodity",
      href: publicRoutes.commodity,
    },
    {
      label: "Career",
      href: publicRoutes.career,
    },
    {
      label: "Intelligence",
      href: publicRoutes.intelligence,
    },
    {
      label: "Economy",
      href: publicRoutes.economy,
    },
  ] satisfies NavigationItem[],

  footerNavigation: [
    {
      label: "About",
      href: "/about",
    },
    {
      label: "Search",
      href: "/search",
    },
    {
      label: "Privacy",
      href: "/privacy",
    },
  ] satisfies NavigationItem[],
} as const;
