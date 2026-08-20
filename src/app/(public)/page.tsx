import type { Metadata } from "next";

import HomePage from "@/features/home/home-page";

export const metadata: Metadata = {
  title: "MineVision — Platform Intelligence Pertambangan Indonesia",
  description:
    "Jelajahi edukasi, industri, komoditas, karier, data intelligence, dan ekonomi sektor pertambangan Indonesia dalam satu platform.",
  openGraph: {
    title: "MineVision — Platform Intelligence Pertambangan Indonesia",
    description:
      "Jelajahi edukasi, industri, komoditas, karier, data intelligence, dan ekonomi sektor pertambangan Indonesia dalam satu platform.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MineVision — Platform Intelligence Pertambangan Indonesia",
    description:
      "Jelajahi edukasi, industri, komoditas, karier, data intelligence, dan ekonomi sektor pertambangan Indonesia dalam satu platform.",
  },
};

export default HomePage;
