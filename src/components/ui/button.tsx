import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-full",
    "font-bold transition-all duration-200",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-brand-cyan",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-background",
    "disabled:pointer-events-none",
    "disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-r",
          "from-brand-blue",
          "via-brand-cyan",
          "to-brand-teal",
          "text-white",
          "shadow-lg shadow-brand-cyan/10",
          "hover:brightness-110",
        ],
        secondary: [
          "border border-border",
          "bg-surface-secondary",
          "text-foreground",
          "hover:bg-muted",
        ],
        outline: [
          "border border-brand-cyan",
          "bg-transparent",
          "text-foreground",
          "hover:bg-brand-cyan",
          "hover:text-background",
        ],
        ghost: [
          "bg-transparent",
          "text-muted-foreground",
          "hover:bg-muted",
          "hover:text-foreground",
        ],
      },
      size: {
        small: "h-9 px-4 text-sm",
        medium: "h-11 px-6 text-sm",
        large: "h-12 px-8 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "medium",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        buttonVariants({
          variant,
          size,
        }),
        className,
      )}
      {...props}
    />
  );
}
