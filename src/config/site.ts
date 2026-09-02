export type NavigationItem = {
  label: string;
  href: string;
};

export const siteConfig = {
  name: "MineVision",
  fullName: "MineVision Intelligence Platform Indonesia",
  description:
    "Platform edukasi, industri, komoditas, karier, data intelligence, dan ekonomi sektor pertambangan Indonesia.",

  mainNavigation: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Education",
      href: "/education",
    },
    {
      label: "Industry",
      href: "/industry",
    },
    {
      label: "Commodity",
      href: "/commodity",
    },
    {
      label: "Career",
      href: "/career",
    },
    {
      label: "Intelligence",
      href: "/intelligence",
    },
    {
      label: "Economy",
      href: "/economy",
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
