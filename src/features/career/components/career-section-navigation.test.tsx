import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CareerSectionNavigation } from "./career-section-navigation";

describe("CareerSectionNavigation", () => {
  it("renders a text-only heading with Education typography", () => {
    const html = renderToStaticMarkup(createElement(CareerSectionNavigation));
    expect(html).toContain('<h2 class="text-lg text-white">Dalam Kategori Ini</h2>');
    expect(html).toContain("text-sm font-semibold leading-5");
  });

  it("distinguishes the active icon from inactive, hover and keyboard-focus states", () => {
    const html = renderToStaticMarkup(createElement(CareerSectionNavigation));
    const activeLink = html.match(/<a href="#professions"[\s\S]*?<\/a>/)?.[0];
    const educationLink = html.match(/<a href="#education"[\s\S]*?<\/a>/)?.[0];
    expect(activeLink).toContain('aria-current="location"');
    expect(activeLink).toContain("border-brand-cyan/50");
    expect(activeLink).toContain("h-4 w-4 shrink-0 text-brand-cyan");
    expect(educationLink).not.toContain("aria-current");
    expect(educationLink).toContain("text-[#7f90a5] group-hover:text-brand-cyan group-focus-visible:text-brand-cyan");
    expect(educationLink).toContain("focus-visible:outline-brand-cyan");
    expect(educationLink).toContain("Pendidikan");
  });
});
