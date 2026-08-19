import type { ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  ["rounded-2xl border", "transition-all duration-200"],
  {
    variants: {
      variant: {
        default: ["border-border", "bg-surface"],
        elevated: [
          "border-white/10",
          "bg-surface-secondary",
          "shadow-xl shadow-black/20",
        ],
        glass: ["border-white/10", "bg-white/5", "backdrop-blur-md"],
      },
      interactive: {
        true: [
          "cursor-pointer",
          "hover:-translate-y-1",
          "hover:border-brand-cyan/50",
          "hover:shadow-xl",
          "hover:shadow-brand-cyan/10",
        ],
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
    },
  },
);

type CardProps = ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof cardVariants>;

export function Card({ className, variant, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        cardVariants({
          variant,
          interactive,
        }),
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("space-y-2 p-6", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      className={cn("font-serif text-xl font-bold text-foreground", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-border px-6 py-4",
        className,
      )}
      {...props}
    />
  );
}
