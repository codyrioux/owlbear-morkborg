# MÖRK BORG Character Sheet for Owlbear Rodeo

An authentic, art-punk character sheet extension for **MÖRK BORG** built for **Owlbear Rodeo**.

```
 ██████╗  ██████╗  ██████╗ ███╗   ███╗
 ██╔══██╗██╔═══██╗██╔═══██╗████╗ ████║
 ██║  ██║██║   ██║██║   ██║██╔████╔██║
 ██║  ██║██║   ██║██║   ██║██║╚██╔╝██║
 ██████╔╝╚██████╔╝╚██████╔╝██║ ╚═╝ ██║
 ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝     ╚═╝
         A DYING WORLD AWAITS
```

## Features

- **Iconic MÖRK BORG Art-Punk Aesthetic**: High-contrast yellow (`#fee700`), pitch black (`#0a0a0a`), and punk pink (`#ff0055`) with authentic gothic blackletter and brutalist styling.
- **Complete Rules Mechanics**:
  - **4 Core Abilities**: Strength, Agility, Presence, Toughness with prominent modifiers (-3 to +3).
  - **Interactive Dice Rolls**: One-click rolls for Ability checks (with selectable DR 8–18), Defend, Weapon Attacks, and Weapon Damage. Automatically flags Critical Successes (Natural 20) and Fumbles (Natural 1).
  - **Long Rest ("A Night's Sleep")**: Automatically rolls **d6** HP healing, rerolls **Omens** (rolling your character's omen die), and rerolls daily **Powers** (Presence + d4) as per the official rules. Supports starving and infected conditions.
  - **Short Rest ("Catch Breath")**: Heals **d4** HP.
  - **Vitals & Omens**: Interactive HP tracker with automated Broken table roller at 0 HP. Full 5-choice Omen spending system (Max damage, Reroll, -d6 damage, Neutralize Crit/Fumble, -4 DR).
  - **Armor & Shields**: Light (-d2), Medium (-d4, +2 DR Agility), and Heavy (-d6, +2 DR Agility, no powers). Degradation tracker on defense fumbles.
  - **Carrying Capacity**: Strength + 8 items slot tracking, silver weight calculation, and over-encumbrance warning banners.
  - **Scrolls & Occult Magic**: Sacred and Unclean scrolls library with Presence DR12 tests, spell failure HP loss, and the official 20-entry Arcane Catastrophes table.
  - **SCVMBIRTHER**: One-click random character generator for instant doomed scum with classes, stats, starting gear, and scrolls.
- **Owlbear Rodeo Integration**:
  - Broadcasts rolls, critical hits, fumbles, and long rest recoveries room-wide to all players.
  - Token metadata binding: link character sheets directly to tokens on the map.
  - Standalone browser fallback: works independently in any browser using `localStorage`.
- **GitHub Pages Ready**:
  - Configured with relative paths (`base: './'`).
  - GitHub Actions automated workflow for continuous deployment.
  - Built-in `bun run deploy` script to publish directly to the `gh-pages` branch.

## Quick Start

### Development
```bash
bun install
bun run dev
```

### Run Tests
```bash
bun test
```

### Build Production Bundle
```bash
bun run build
```

### Deploy to `gh-pages` Branch
```bash
bun run deploy
```

## Installing in Owlbear Rodeo

1. Host this repository on GitHub Pages or use the built `gh-pages` branch.
2. In Owlbear Rodeo, open **Extensions** -> **Add Extension**.
3. Enter the URL of your hosted manifest:
   ```
   https://<username>.github.io/<repo>/manifest.json
   ```
4. Click **Install**. The MÖRK BORG skull icon will now appear in your action toolbar.

---
*MÖRK BORG is copyright Ockult Örtmästare Games and Stockholm Kartell.*
