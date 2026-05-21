---
name: cuentalimpia-design
description: Use this skill to generate well-branded interfaces and assets for CuentaLimpia, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping a personal-finance app in the CuentaLimpia voice (modern, vibrant, empowering, Argentine voseo).
user-invocable: true
---

# CuentaLimpia Design Skill

CuentaLimpia is a responsive personal-finance web app (mobile-first, also desktop) for tracking income, expenses, debit & credit cards with installment (*cuotas*) tracking, and visualizing money through charts. The brand voice is **empowering, close, jargon-free** — *aliado financiero*, never a bank.

## Quick start

1. **Read `README.md`** first — it contains the full product context, content fundamentals, visual foundations, iconography rules, and accessibility guide.
2. **Import the tokens** by linking `colors_and_type.css` or generating platform output from `tokens.json`. Always use semantic CSS variables (`var(--color-primary)`, `var(--color-income)`), never raw hex.
3. **Lift components from `ui_kits/cuentalimpia/`** when possible — they're cosmetic recreations of the existing shadcn-based codebase, modular and copy-pastable.
4. **Speak Argentine Spanish (voseo).** *Registrá / ingresá / tenés / podés*. Never *registra / tienes / puedes*. See README → CONTENT FUNDAMENTALS for the full glossary.

## Brand at a glance

- **Primary:** deep violet `#5B47E0` light · `#7C6BFF` dark. Used for actions, active nav, brand mark.
- **Income/positive:** emerald `#10B981`. **Always** paired with an icon (↗) and a `+` sign.
- **Expense/negative:** red `#EF4444`. **Always** paired with an icon (↘) and a `−` sign.
- **Pending (cuotas):** amber `#F59E0B`.
- **Type:** Plus Jakarta Sans (geometric humanist), 400/500/600/700. 16px base, `tabular-nums` on all monetary values.
- **Radii:** 6 / 10 / 14 / 20 / pill. Cards lean on 14–20.
- **Native dark mode** — not a recolor. Both themes are tokenized.
- **Icons:** Lucide only, 2px stroke. No icon font, no emoji except ✅ / ⚠ / 🗑️ in toasts.

## What's in this skill

| Path | Purpose |
|---|---|
| `README.md` | Full design system documentation — start here |
| `colors_and_type.css` | All design tokens as CSS variables (light + dark) |
| `tokens.json` | Same tokens in JSON, for cross-platform / Style Dictionary |
| `assets/logo.svg`, `assets/logo-wordmark.svg`, `assets/logo-wordmark-dark.svg` | Brand mark + wordmarks |
| `preview/*.html` | Inspectable cards for every token, component, and pattern |
| `ui_kits/cuentalimpia/` | High-fidelity, click-through UI kit (login → dashboard → cards → settings) |

## When invoked

- **Mocks / prototypes / throwaway HTML:** copy `colors_and_type.css` + `assets/logo.svg` into your output folder, link them, and use the components from `ui_kits/cuentalimpia/` as your starting point. Static HTML files for the user to view.
- **Production code:** copy assets and read the rules in `README.md` to become an expert in designing with this brand. The token names are stable; you can wire them into Tailwind, CSS-in-JS, or shadcn/ui without changing semantics.

## If invoked without guidance

Ask the user:
1. What are you trying to build? (a screen, a marketing page, a slide, a feature spec, etc.)
2. Mobile, desktop, or both?
3. Should it lean on the existing screens in `ui_kits/cuentalimpia/` or explore something new?
4. Do you want light, dark, or both?

Then act as an expert designer who outputs **HTML artifacts** (for design exploration) or **production code** (when working inside the real codebase), depending on the need. Default to HTML mocks unless told otherwise.

## Source codebase

The original product lives at `https://github.com/GianPolicari/cuenta-limpia` — Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + lucide-react + recharts + Supabase. The codebase uses an emerald-green primary; this design system shifts to deep violet. Treat any emerald accents in the source code as legacy.
