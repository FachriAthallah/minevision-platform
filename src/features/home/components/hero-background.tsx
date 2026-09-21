"use client";

import { useEffect, useState } from "react";

import TopologyField from "@/components/ui/topology-field";

export function HeroBackground() {
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);

    query.addEventListener("change", update);

    const frame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", update);
    };
  }, []);

  if (reduced) {
    return null;
  }

  if (reduced === null) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <TopologyField className="h-full w-full" />
    </div>
  );
}