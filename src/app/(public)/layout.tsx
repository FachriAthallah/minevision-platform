import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { AnalyticsTracker } from "@/features/admin/components/analytics-tracker";
import { WebVitalsReporter } from "@/features/admin/components/web-vitals-reporter";
import { getPublishedSiteProfile } from "@/features/admin/lib/site-settings";
import { MineBotProvider } from "@/features/minebot/components/minebot-provider";
import { MineBotFab } from "@/features/minebot/components/minebot-fab";

type PublicLayoutProps = {
  children: ReactNode;
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const profile = await getPublishedSiteProfile();
    const description =
      profile.seoDescription ||
      "Platform edukasi, industri, komoditas, karier, data intelligence, dan ekonomi sektor pertambangan Indonesia.";
    const title = profile.name
      ? `${profile.name} — ${profile.tagline || "Intelligence Platform Indonesia"}`
      : "MineVision Intelligence Platform Indonesia";

    return {
      title: {
        default: title,
        template: `%s | ${profile.name || "MineVision"}`,
      },
      description,
      applicationName: profile.name || "MineVision",
    };
  } catch {
    return {
      title: {
        default: "MineVision Intelligence Platform Indonesia",
        template: "%s | MineVision",
      },
    };
  }
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const profile = await getPublishedSiteProfile().catch(() => null);

  return (
    <MineBotProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <PublicHeader />

        <main className="flex-1">{children}</main>

        <PublicFooter
          footerDescription={profile?.footerDescription || undefined}
          copyrightText={profile?.footerCopyright || undefined}
          officialSourceLinks={
            profile?.officialSources?.length
              ? profile.officialSources.map((link) => ({
                  label: link.label,
                  href: link.url,
                  external: true,
                }))
              : undefined
          }
        />

        <MineBotFab />

        <AnalyticsTracker />
        <WebVitalsReporter />
      </div>
    </MineBotProvider>
  );
}
