"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useInView } from "@/lib/hooks/use-in-view";

type RevealDirection = "up" | "down" | "left" | "right" | "scale" | "fade";

type RevealProps = {
  children: ReactNode;
  direction?: RevealDirection;
  delay?: number;
  className?: string;
};

const directionClass: Record<RevealDirection, string> = {
  up: "mv-reveal--up",
  down: "mv-reveal--down",
  left: "mv-reveal--left",
  right: "mv-reveal--right",
  scale: "mv-reveal--scale",
  fade: "mv-reveal--fade",
};

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  className,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const style: CSSProperties | undefined =
    delay > 0 ? { transitionDelay: `${delay}ms` } : undefined;

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "mv-reveal",
        directionClass[direction],
        inView && "mv-reveal-is-visible",
        className,
      )}
    >
      {children}
    </div>
  );
}