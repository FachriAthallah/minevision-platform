"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { isExternalHref } from "../client/chat-citations";

type MineBotLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
};

/**
 * Navigation helper for MineBot links. Internal MineVision pages use Next.js
 * Link so the conversation survives client-side page changes; only external
 * http(s) destinations open in a new tab.
 */
export function MineBotLink({
  href,
  className,
  children,
  ...rest
}: MineBotLinkProps) {
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}