import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { publicRoutes, siteConfig } from "./site";

const appRoot = fileURLToPath(new URL("../app/(public)/", import.meta.url));

function routeExists(href: string) {
  const path = href.split(/[?#]/u)[0] ?? "/";
  const route = path === "/" ? "page.tsx" : `${path.slice(1)}/page.tsx`;
  const exact = new URL(
    route.replaceAll("\\", "/"),
    `file:///${appRoot.replaceAll("\\", "/")}/`,
  );

  if (existsSync(exact)) return true;

  const segments = path.slice(1).split("/");
  if (segments.length < 2) return false;
  const dynamic = `${segments.slice(0, -1).join("/")}/[slug]/page.tsx`;

  return existsSync(
    new URL(dynamic, `file:///${appRoot.replaceAll("\\", "/")}/`),
  );
}

describe("public link integrity", () => {
  it("resolves every static canonical public route to an app page", () => {
    const hrefs = new Set([
      ...siteConfig.mainNavigation.map((item) => item.href),
      ...Object.values(publicRoutes),
    ]);

    for (const href of hrefs) {
      expect(href, `internal route ${href}`).toMatch(/^\//u);
      expect(routeExists(href), `page for ${href}`).toBe(true);
    }
  });
});
