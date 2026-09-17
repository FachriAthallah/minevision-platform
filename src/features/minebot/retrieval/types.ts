import type { MineBotContext, MineBotSource } from "../types/minebot";

export type { MineBotSource, MineBotContext };

export interface MineBotRetriever {
  retrieve(query: string): Promise<MineBotContext[]>;
}
