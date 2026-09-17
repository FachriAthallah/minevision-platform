import type { ReactNode } from "react";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { MineBotProvider } from "@/features/minebot/components/minebot-provider";
import { MineBotFab } from "@/features/minebot/components/minebot-fab";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <MineBotProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <PublicHeader />

        <main className="flex-1">{children}</main>

        <PublicFooter />

        <MineBotFab />
      </div>
    </MineBotProvider>
  );
}
