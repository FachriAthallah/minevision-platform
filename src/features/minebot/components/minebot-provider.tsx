"use client";

import { createContext, useContext, ReactNode } from "react";
import { useMineBotChat } from "../hooks/use-minebot-chat";

const MineBotContext = createContext<ReturnType<typeof useMineBotChat> | null>(null);

export function MineBotProvider({ children }: { children: ReactNode }) {
  const chat = useMineBotChat();
  return <MineBotContext.Provider value={chat}>{children}</MineBotContext.Provider>;
}

export function useMineBot() {
  const context = useContext(MineBotContext);
  if (!context) throw new Error("useMineBot must be used within MineBotProvider");
  return context;
}
