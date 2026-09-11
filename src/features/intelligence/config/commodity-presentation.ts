import type { LucideIcon } from "lucide-react";
import {
  Anvil,
  Boxes,
  CircleDot,
  Gem,
  Hexagon,
  Mountain,
  Pickaxe,
} from "lucide-react";

import type { IntelligenceCommoditySlug } from "../types/dashboard";

export type IntelligenceCommodityPresentation = {
  color: string;
  softColor: string;
  icon: LucideIcon;
};

export const commodityPresentation: Record<
  IntelligenceCommoditySlug,
  IntelligenceCommodityPresentation
> = {
  batubara: { color: "#2f7df4", softColor: "rgba(47,125,244,.16)", icon: Mountain },
  nikel: { color: "#24b8a6", softColor: "rgba(36,184,166,.16)", icon: Hexagon },
  emas: { color: "#d7aa39", softColor: "rgba(215,170,57,.16)", icon: Gem },
  tembaga: { color: "#c87345", softColor: "rgba(200,115,69,.16)", icon: CircleDot },
  timah: { color: "#7f9fbd", softColor: "rgba(127,159,189,.16)", icon: Anvil },
  "bijih-besi": { color: "#c95454", softColor: "rgba(201,84,84,.16)", icon: Pickaxe },
  bauksit: { color: "#c96f52", softColor: "rgba(201,111,82,.16)", icon: Boxes },
};
