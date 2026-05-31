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
    expect(css).toMatch(/\.console-header\s*\{[\s\S]*?min-height:\s*352px;/);
    expect(css).toMatch(/\.console-header::after\s*\{[\s\S]*?border:\s*1px solid rgba\(56, 189, 248, 0\.22\);/);
    expect(css).toMatch(/\.console-header h1::before\s*\{[\s\S]*?content:\s*">";/);
    expect(css).toMatch(/\.header-actions::before\s*\{[\s\S]*?radial-gradient/);
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
});
