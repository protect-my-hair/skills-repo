# Component Guidelines

> Component rules for frontend work in this repository.

---

## Current Status

The project currently uses React 19 through Next.js 16. Components are plain
React components with TypeScript props and global CSS classes.

Do not introduce a component library or CSS framework without a task-backed
need.

---

## Component Boundaries

When components are introduced, follow the project-wide maintainability rules
from `AGENTS.md`:

- Keep components focused on a clear responsibility.
- Avoid speculative abstractions and generic component systems before repeated
  usage exists.
- Prefer clear prop names that describe intent.
- Keep shared components in `src/components/`.

---

## Props

Props use explicit TypeScript object types near the component when the component
is local to one file. Extract props/types only when multiple files need them.

Event callbacks use `on<Action>` names, for example `onSelect`,
`onTransition`, and `onPreviewModeChange`.

---

## Styling

The current styling approach is `src/app/globals.css` with CSS variables and
class names. Keep cards to individual repeated items, modals, and tool panels;
do not create nested decorative cards.

For the Skills Repo MVP, keep the first screen as an operational console rather
than a landing page. Prefer dense but scannable enterprise UI: compact stats,
labeled filters, clear table/card affordances, a persistent detail workspace,
8px-or-smaller radii, 44px interactive targets where practical, visible focus
states, and semantic color tokens from `src/app/globals.css`.

The current dark theme follows the `ui-ux-pro-max` Enterprise Gateway / OLED
direction. Use the existing tokens in `src/app/globals.css` as the source of
truth: OLED slate backgrounds (`--bg`, `--surface`, `--surface-muted`), green
primary/action states (`--green`), blue/amber/red status accents, and high
contrast text. Do not introduce a separate marketing hero, a new UI library, or
one-off page colors for routine visual polish.

When strengthening the first screen, keep it terminal-inspired rather than
marketing-led: use the existing title, chips, and `const skills = ...` code
card, with CSS-only grid/glow/scanline effects if needed. Header action modules
such as role selection and logout placeholders should stay compact in the top
navigation bar instead of becoming large feature cards.

If browser feedback says the header hero feels too empty, fill the space with a
concise product-description treatment and non-interactive tag pills. Tags should
come from existing state or truthful product scope, such as current results,
collected `SKILL.md` files, controlled Git sources, or version/audit history.
Do not add new navigation buttons, filters, backend calls, or external
marketplace claims just to make the hero look fuller.

Hero tags do not need to mirror every available metric. When the hero starts to
read like a dashboard status strip, remove lower-value pills and keep only the
tags that communicate repository scope or trust signals cleanly.

For detail sidebars, version history should prefer a release-timeline treatment
over a plain stacked list when the content includes version number, changelog,
publisher metadata, and a textual diff. Keep it visually dense and console-like,
but do not change the underlying version or audit behavior just to support the
presentation.

Native form controls must follow the same dark console theme. In particular,
all `select` controls need explicit dark styling for the closed control and the
native option list where the browser allows it:

```css
html,
select,
input,
textarea {
  color-scheme: dark;
}

select {
  appearance: none;
}

select option {
  background: var(--surface-muted);
  color: var(--ink);
}
```

When changing the dark theme, keep a regression test that reads
`src/app/globals.css` and checks the select/option/disabled rules so browser
defaults do not reintroduce white dropdowns.

When a user asks to align the whole console with the dark Skill card style, keep
existing product content intact and only reuse approved existing values. For
example, the top shell may render the existing `Skills 总数` value as a
code-style `const skills = <summary.total>;`, but do not introduce extra hero
copy, marketing slogans, or new metrics unless the user approves the content.

---

## Accessibility

Icon buttons should include a `title` or text label. Decorative Lucide icons
should use `aria-hidden="true"`. Inputs/selects should be wrapped in labels
or have an explicit accessible label.
