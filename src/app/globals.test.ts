import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

describe("global CSS theme", () => {
  test("uses the ui-ux-pro-max OLED enterprise palette", () => {
    expect(css).toContain("--bg: #020617;");
    expect(css).toContain("--surface: #0f172a;");
    expect(css).toContain("--surface-muted: #1e293b;");
    expect(css).toContain("--green: #22c55e;");
  });

  test("keeps the terminal-inspired header visual treatment", () => {
    expect(css).toMatch(/\.console-header\s*\{[\s\S]*?grid-template-rows:\s*auto 1fr;/);
    expect(css).toMatch(/\.console-header\s*\{[\s\S]*?min-height:\s*430px;/);
    expect(css).toMatch(/\.header-topbar\s*\{[\s\S]*?border-bottom:\s*1px solid rgba\(148, 163, 184, 0\.2\);/);
    expect(css).toMatch(/\.hero-watermark\s*\{[\s\S]*?font-size:\s*116px;/);
    expect(css).toMatch(/\.hero-kicker\s*\{[\s\S]*?border-radius:\s*999px;/);
    expect(css).toMatch(/\.hero-description\s*\{[\s\S]*?max-width:\s*820px;/);
    expect(css).toMatch(/\.hero-description::before\s*\{[\s\S]*?content:\s*"“";/);
    expect(css).toMatch(/\.hero-tags strong\s*\{[\s\S]*?color:\s*#f0a58d;/);
  });

  test("keeps native select controls aligned with the dark theme", () => {
    expect(css).toContain("color-scheme: dark;");
    expect(css).toMatch(/select\s*\{[\s\S]*?appearance:\s*none;/);
    expect(css).toMatch(/select\s*\{[\s\S]*?background-image:[\s\S]*?rgba\(56, 189, 248, 0\.14\)/);
    expect(css).toMatch(
      /select option\s*\{[\s\S]*?background:\s*var\(--surface-muted\);[\s\S]*?color:\s*var\(--ink\);/,
    );
    expect(css).toMatch(/select:focus-visible,[\s\S]*?\{[\s\S]*?border-color:\s*rgba\(34, 197, 94, 0\.76\);/);
    expect(css).toMatch(/select:disabled\s*\{[\s\S]*?color:\s*var\(--subtle\);/);
  });

  test("renders version history as a timeline with a diff console", () => {
    expect(css).toMatch(/\.version-card\s*\{[\s\S]*?grid-template-columns:\s*16px minmax\(0, 1fr\);/);
    expect(css).toMatch(/\.version-card-node\s*\{[\s\S]*?border:\s*2px solid rgba\(56, 189, 248, 0\.4\);/);
    expect(css).toMatch(/\.detail-pill\.positive\s*\{[\s\S]*?color:\s*var\(--green-strong\);/);
    expect(css).toMatch(/\.diff-box-header\s*\{[\s\S]*?border-bottom:\s*1px solid rgba\(148, 163, 184, 0\.14\);/);
    expect(css).toMatch(/\.diff-stat\.remove\s*\{[\s\S]*?color:\s*var\(--red\);/);
  });

  test("keeps login and registration aligned with ui-ux-pro-max", () => {
    expect(css).toMatch(/\.auth-shell\s*\{[\s\S]*?var\(--bg\);/);
    expect(css).toMatch(/\.auth-stage\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1\.05fr\) minmax\(340px, 440px\);/);
    expect(css).toMatch(/\.auth-copy,[\s\S]*?\.auth-card\s*\{[\s\S]*?var\(--surface\);/);
    expect(css).toMatch(/\.auth-kicker\s*\{[\s\S]*?var\(--green-soft\);/);
    expect(css).toMatch(/\.auth-tabs button\.active\s*\{[\s\S]*?background:\s*var\(--green\);/);
    expect(css).toMatch(/\.auth-field:focus-within div\s*\{[\s\S]*?border-color:\s*rgba\(34, 197, 94, 0\.76\);/);
    expect(css).toMatch(/\.auth-submit\s*\{[\s\S]*?background:\s*var\(--green\);/);
    expect(css).toMatch(/@media \(max-width:\s*860px\)\s*\{[\s\S]*?\.auth-stage\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
  });
});
