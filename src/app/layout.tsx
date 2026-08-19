import type { Metadata } from "next";
import { Lato, Merriweather } from "next/font/google";

import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-merriweather",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MineVision Intelligence Platform Indonesia",
    template: "%s | MineVision",
  },
  description:
    "Platform edukasi, industri, komoditas, karier, data intelligence, dan ekonomi sektor pertambangan Indonesia.",
  applicationName: "MineVision",
  authors: [
    {
      name: "Muhammad Fachri Athallah Sofyan",
    },
  ],
  keywords: [
    "MineVision",
    "pertambangan Indonesia",
    "komoditas tambang",
    "edukasi pertambangan",
    "karier pertambangan",
    "data intelligence",
    "ekonomi pertambangan",
  ],
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="id">
      <body
        className={`${lato.variable} ${merriweather.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}