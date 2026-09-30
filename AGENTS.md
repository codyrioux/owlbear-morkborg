# AGENTS.md — Developer & Agent Guide for `owlbear-morkborg`

This document provides essential instructions, architectural patterns, design standards, and hard-won lessons learned for AI agents and human developers working on the **MÖRK BORG Character Sheet Extension for Owlbear Rodeo**.

---

## 1. Project Overview & Philosophy

`owlbear-morkborg` is an authentic, art-punk character sheet extension for **Owlbear Rodeo (OBR v3)** designed specifically for the grimdark tabletop RPG **MÖRK BORG** (Ockult Örtmästare Games / Stockholm Kartell).

### Core Pillars
1. **Art-Punk Brutalism**: The UI must look like the official MÖRK BORG rulebook and character sheets—harsh, high-contrast, grungy, typography-heavy, and unapologetic. Never introduce bland modern corporate UI or rounded minimalist buttons.
2. **Rules Fidelity**: Implement official MÖRK BORG core rules accurately: -3 to +3 ability modifiers, DR 12 tests, Natural 20 crits and Natural 1 fumbles, canonical Long and Short Rest mechanics, official Broken table outcomes, encumbrance penalties, armor tiers with defense degradation, and Arcane Catastrophes.
3. **Owlbear Rodeo Integration**: Seamlessly broadcast rolls to the OBR room, allow linking sheets to map tokens via metadata, and gracefully fall back to standalone browser operation when run outside an OBR room.
4. **Resilient Local Persistence**: State must persist in browser `localStorage` across page reloads and browser sessions without race conditions or data loss.

---

## 2. Environment & Tooling

- **Runtime & Package Manager**: **Bun** is the primary toolchain (`bun`, `bunx`).
  - Do **not** rely on `npm` or `yarn` being installed.
  - Install dependencies: `bun install`
  - Run development server: `bun run dev`
  - Run test suite: `bun test`
  - Build production bundle: `bun run build`
- **Frontend Stack**: React 18, TypeScript, Tailwind CSS, Lucide React icons, Vite.
- **Testing Framework**: Vitest (executed via `bun test`).
- **SDK**: `@owlbear-rodeo/sdk` (^3.1.0).

---

## 3. Architecture & Directory Tour

```
owlbear-morkborg/
├── .github/workflows/
│   └── deploy.yml          # Automated CI/CD: tests, builds, and deploys to gh-pages on push to main
├── public/
│   ├── icon.svg            # OBR toolbar action icon (CRITICAL: must use transparent alpha masking)
│   └── manifest.json       # OBR extension manifest (CRITICAL: bump patch version before push; relative URLs)
├── src/
│   ├── components/         # Art-punk styled React components
│   │   ├── Header.tsx           # Name, class, rest triggers, scvmbirther, import/export
│   │   ├── AbilitiesGrid.tsx    # STR, AGI, PRE, TGH cards with DR selector & ROLL buttons
│   │   ├── VitalsSection.tsx    # HP bar, Broken trigger, Omens pool, Powers tracker, Silver
│   │   ├── CombatSection.tsx    # Armor tiers, shield, defend roll, armor soak, weapon attacks
│   │   ├── InventorySection.tsx # STR + 8 slot tracker, encumbrance warning, item management
│   │   ├── ScrollsSection.tsx   # Sacred/Unclean scrolls, canon spell library, DR12 invoke roller
│   │   ├── RestModal.tsx        # Long rest (d6 HP, omens, powers) & Short rest (d4 HP)
│   │   ├── RollResultModal.tsx  # Universal roll card with crit/fumble banners & instant omen spend
│   │   ├── SpendOmenModal.tsx   # 5 canon omen choices (max damage, reroll, -d6 dmg, neutralize, -4 DR)
│   │   ├── BrokenModal.tsx      # Official d4 Broken table roller
│   │   └── ExportImportModal.tsx# CSP-compliant JSON export (Blob/Clipboard) & upload/paste import
│   ├── obr/
│   │   └── obrService.ts   # Owlbear Rodeo SDK v3 wrapper (broadcasts, token metadata, context menu)
│   ├── types/
│   │   └── morkborg.ts     # Canonical TypeScript interfaces for all domain models
│   ├── utils/
│   │   ├── dice.ts         # Crypto-random dice roller, formula parser, 3d6 modifier converter
│   │   ├── morkborgRules.ts# Rules engine (checks, crits/fumbles, rests, broken table, SCVMBIRTHER)
│   │   └── storage.ts      # LocalStorage save/load with schema validation and error fallback
│   ├── App.tsx             # Root component with synchronous state hydration and live persistence
│   └── index.css           # Custom fonts, Tailwind directives, grungy scrollbars, brutal utilities
├── tailwind.config.js      # Palette (mb-yellow, mb-black, mb-pink, mb-bone) & font definitions
└── vite.config.ts          # Configured with `base: './'` for GitHub Pages subpath compatibility
```

---

## 4. Critical Technical Constraints & "Gotchas"

### A. Owlbear Rodeo Toolbar Icon Masking
> [!WARNING]
> Owlbear Rodeo renders toolbar extension icons using CSS `mask-image` with a solid white color.
- CSS `mask-image` evaluates **only the alpha channel** of the SVG. Any pixel with opacity > 0 is painted solid white.
- **NEVER** add a solid background `<rect>` (such as `#fee700`) to `public/icon.svg`. Doing so turns the entire button into a featureless white square in OBR.
- The icon must feature a **completely transparent background** with compound path cutouts (`fill-rule="evenodd"`) for eye sockets, nose cavity, teeth, and symbols.

### B. Content Security Policy (CSP) & Iframe Sandbox
> [!WARNING]
> Owlbear Rodeo extensions run within sandboxed iframes governed by a strict Content Security Policy.
- The `frame-src` directive forbids navigating or downloading via `data:` URIs (e.g., `data:text/json;charset=utf-8,...`). Attempting this throws a CSP violation.
- **Always** generate downloads using in-memory `Blob` objects and `URL.createObjectURL(blob)`:
  ```typescript
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  ```
- Always offer `navigator.clipboard.writeText(...)` as an immediate one-click copy alternative.

### C. Relative Paths for GitHub Pages
- The extension is served from a GitHub Pages subpath (e.g., `https://<username>.github.io/<repo>/`).
- `vite.config.ts` **must** specify `base: './'` to produce relative asset links.
- `public/manifest.json` **must** use relative URLs (`icon.svg`, `index.html`) or paths compatible with the repository subpath. Never use root-absolute paths like `/icon.svg` without subpath awareness.

### D. LocalStorage Hydration & Synchronization
- To prevent initial render race conditions from overwriting stored characters:
  ```typescript
  // In App.tsx: Load synchronously inside useState initial state callback!
  const [character, setCharacter] = useState<Character>(() => {
    return loadCharacterFromStorage() || generateRandomCharacter();
  });
  ```
- Any state update must automatically sync back to `localStorage` via `saveCharacterToStorage(character)`.
- Generating a new character via **SCVMBIRTHER** or importing JSON must overwrite `localStorage`.
- Deserialization in `storage.ts` must validate the payload schema and catch `SyntaxError`s, returning `null` (and falling back to a clean character) rather than crashing the extension.

### E. GitHub Actions & CI/CD Deployment
- The repository uses `.github/workflows/deploy.yml` which deploys `./dist` to the `gh-pages` branch on every push to `main`.
- **Do not** introduce local manual git scripts that commit directly to `gh-pages`, as they will conflict with GitHub Actions commits.

### F. Manifest Versioning
- **Always bump the "patch" component** of the version string in `public/manifest.json` before pushing changes to `main` (e.g., `1.1.1` → `1.1.2`).
- Also mirror this version bump in `package.json` to keep project metadata synchronized.
- Owlbear Rodeo inspects the manifest version to detect updates for installed extensions. Bumping the patch version ensures OBR recognizes the extension update and room participants receive the latest code without caching stale assets.

---

## 5. MÖRK BORG Rules Cheat Sheet

When adding or modifying gameplay rules, adhere to official canon:

| Mechanic | Rule / Implementation |
|---|---|
| **Ability Scores** | Generated 3d6 (or class-modified). Converted to modifiers: 1–4: -3, 5–6: -2, 7–8: -1, 9–12: 0, 13–14: +1, 15–16: +2, 17–20: +3. |
| **Difficulty Rating (DR)** | Standard check is DR 12. Easy: DR 8, Normal: DR 12, Hard: DR 14, Extreme: DR 16, Impossible: DR 18. |
| **Critical & Fumble** | Natural 20 = Critical (double damage or maximum effect). Natural 1 = Fumble (attack breaks weapon/grants counter, defense doubles damage & degrades armor tier). |
| **Long Rest** | "A night's sleep". Heals **d6** HP. Rerolls **Omens** (character's omen die, d2 or d4). Rerolls **Powers** (Presence + d4, min 0). Starving: no HP heal. Infected: takes d6 damage, no heal. |
| **Short Rest** | "Catch breath & drink". Heals **d4** HP. |
| **Omens (5 Choices)** | 1) Deal max damage on attack. 2) Reroll any die. 3) Lower damage taken by d6. 4) Neutralize a Crit or Fumble. 5) Lower check DR by 4 before rolling. |
| **Armor Tiers** | Tier 0: None (soak 0, 0 slots). Tier 1: Light (-d2 soak, 1 slot). Tier 2: Medium (-d4 soak, 1 slot, +2 DR Agility tests incl. defence, no powers/scrolls). Tier 3: Heavy (-d6 soak, 1 slot, +4 DR Agility tests, defence is DR +2, no powers/scrolls). Shields: -1 damage soak (1 slot). |
| **Carrying Capacity** | Normal capacity = `Strength + 8` slots. Armor of any tier (except 0) = 1 slot. Shield = 1 slot. Weapons/heavy items take 1 or 2 slots. Every 100 silver = 1 slot. Exceeding capacity adds +2 DR to Strength and Agility checks. |
| **Broken Table (0 HP)** | Roll d4 when reduced to 0 HP: 1 = Fall unconscious d4 hours, wake with d4 HP. 2 = Crippled (lost limb/eye). 3 = Hemorrhaging (dies in d2 hours unless treated). 4 = Dead. |
| **Scrolls & Catastrophes** | Invoking a scroll requires a Presence DR 12 check. Failure costs d2 HP and triggers 1-hour cooldown. Natural 1 triggers the 20-entry Arcane Catastrophes table. |

---

## 6. Art-Punk Styling Guide

When writing UI components, maintain the distinctive visual language defined in `tailwind.config.js` and `src/index.css`:

### Color Palette
- `mb-yellow`: `#fee700` — Toxic neon yellow for highlights, primary badges, buttons, and crits.
- `mb-black`: `#0a0a0a` — Jet pitch black for backgrounds, borders, and dark containers.
- `mb-pink`: `#ff0055` — Punk fuchsia for warnings, fumbles, omens, broken status, and destructive actions.
- `mb-bone`: `#ded9c5` — Parchment bone off-white for body text and readable panels.
- `mb-blood`: `#900c14` — Deep crimson for severe damage and fatal warnings.

### Typography
- `font-gothic` (`UnifrakturMaguntia`): Use for major titles, dramatic headings, and thematic banners.
- `font-punk` (`Special Elite`): Use for descriptions, quirks, lore, and typewriter flavor text.
- `font-brutal` (`Space Grotesk` / `Impact`): Use for numbers, stat modifiers, buttons, and UI labels.

### Component Styling Patterns
- **Buttons**:
  ```tsx
  <button className="bg-mb-yellow hover:bg-yellow-300 text-mb-black font-brutal font-bold uppercase tracking-wider px-3 py-1.5 border-2 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-transform">
    ROLL STR
  </button>
  ```
- **Cards & Containers**:
  ```tsx
  <div className="bg-mb-dark border-2 border-mb-yellow/40 p-4 shadow-brutal">
    {/* Content */}
  </div>
  ```
- **Angled Badges / Tape Banners**:
  ```tsx
  <span className="inline-block bg-mb-pink text-white font-brutal text-xs font-black px-2 py-0.5 uppercase tracking-widest -rotate-2 border border-black shadow-brutal-sm">
    OVERENCUMBERED
  </span>
  ```

---

## 7. Verification Checklist Before Submitting Changes

Before pushing commits or finishing any task, run through this checklist:

1. **Unit Tests**:
   ```bash
   bun test
   ```
   Ensure all test suites pass with 0 failures. If new rules, dice math, or persistence logic were added, write accompanying unit tests.
2. **TypeScript & Bundler**:
   ```bash
   bun run build
   ```
3. **Bump Manifest Version (Patch)**:
   Increment the patch component of `"version"` in `public/manifest.json` (e.g., `1.1.1` → `1.1.2`) and mirror it in `package.json` before committing so Owlbear Rodeo recognizes the extension update.
4. **OBR Icon Integrity**:
   Verify `public/icon.svg` has not been altered to add background fills or non-transparent backdrops.
5. **Git Discipline**:
   Push exclusively to `main`. GitHub Actions will automatically handle the build and deployment to `gh-pages`.
