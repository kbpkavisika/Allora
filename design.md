# Allora Design System Reference

Design system reference · v1.0 · iOS / Android

Tokens and component specs for the Allora marketplace mobile app. Achromatic surfaces, one hot accent, hairline structure, edge-to-edge product imagery.

**Header quick-facts**

| Key | Value |
|---|---|
| base unit | 4px |
| type | Archivo / IBM Plex Mono |
| accent | #D33A2C |
| frame | 390 × 844 |

---

## 01 · Colour

Every token below has a light and a dark value. Neutrals and surfaces invert between modes (light backgrounds/dark text swap to dark backgrounds/light text). Saturated brand and semantic hues keep their hue in both modes; `success` and `warning` are brightened in dark mode since their light-mode fills are too low-lightness to stay legible on a near-black surface.

### Ink & neutrals

| Swatch | Name | Token | Light | Dark | Notes |
|---|---|---|---|---|---|
| ⬛ | Ink 900 | `primary` | `#101112` | `#F5F5F6` | |
| ⬛ | Ink 700 | `primary-hover` | `#2E3133` | `#E4E6E8` | |
| ⬛ | Ink 500 | `secondary` | `#6B7075` | `#9BA0A5` | |
| ⬛ | Ink 400 | `disabled` | `#9BA0A5` | `#5C6165` | disabled only · 2.64:1 (light) |
| ⬛ | Grey 400 | `border-strong` | `#8C9297` | `#55585B` | 3.15:1 (light) |
| ⬛ | Grey 200 | `border` | `#E4E6E8` | `#2A2B2D` | light border colour `#D8DADC` |

### Surfaces

| Swatch | Name | Token | Light | Dark |
|---|---|---|---|---|
| ⬜ | Surface | `surface` | `#FFFFFF` | `#101112` |
| ⬜ | Surface muted | `surface-muted` | `#F7F8F8` | `#1C1D1E` |
| ⬜ | Surface sunken | `surface-sunken` | `#F1F2F3` | `#252627` |

### Accent & info

| Swatch | Name | Token | Light | Dark |
|---|---|---|---|---|
| 🟥 | Signal | `accent` | `#D33A2C` | `#D33A2C` |
| 🟥 | Signal press | `accent-pressed` | `#B62E22` | `#B62E22` |
| 🟥 | Signal tint | `accent-tint` | `#FBEDEB` (border `#F3DCD9`) | `#2C1613` (border `#4A241F`) |
| 🟦 | Tide | `info` | `#2F6BD8` | `#2F6BD8` |
| 🟦 | Tide 200 | `info-track` | `#B9CDF2` (border `#A9C0EC`) | `#24406E` |
| 🟦 | Tide tint | `info-tint` | `#EDF2FC` (border `#DDE6F8`) | `#16233B` (border `#223655`) |

### Semantic

| Name | Token | Light fill | Dark fill | Light tint | Dark tint |
|---|---|---|---|---|---|
| Success | `success` / `success-tint` | `#197A4B` | `#22A566` | `#E8F3EC` (border `#D6E8DC`) | `#12261C` (border `#1E3A2C`) |
| Warning | `warning` / `warning-tint` | `#8A5300` | `#C97F1D` | `#FBF2E3` (border `#F1E4CD`) | `#2C2211` (border `#4A3819`) |
| Error | `error` / `error-tint` | `#C4291F` | `#C4291F` | `#FBEBEA` (border `#F2D8D6`) | `#2E1614` (border `#4A2320`) |
| Info | `info` / `info-tint` | `#2F6BD8` | `#2F6BD8` | `#EDF2FC` (border `#DDE6F8`) | `#16233B` (border `#223655`) (same values as Tide) |

> **Note (verbatim):** "Accent is reserved: active tab indicator, TRENDING/sale flags, destructive confirmation. Never a large fill. Product imagery is the only saturated area of a screen."

---

## 02 · Typography

Display & text: **Archivo** (400 / 500 / 600 / 700 / 800) · Data & labels: **IBM Plex Mono** (400 / 500)

| Token | Size / Line-height / Weight / Letter-spacing | Example text | Font | Default color |
|---|---|---|---|---|
| display | 34 / 38 / 800 / -0.03em | "Hi Alex" | Archivo | `primary` |
| h1 | 28 / 32 / 700 / -0.025em | "Your recent orders" | Archivo | `primary` |
| h2 | 22 / 28 / 700 / -0.02em | "Summary" | Archivo | `primary` |
| h3 | 18 / 24 / 600 / -0.01em | "Ridge Shell Jacket" | Archivo | `primary` |
| text-lg | 17 / 24 / 400 / 0 | "Tracking info will be emailed within 1–2 business days." | Archivo | `primary` |
| text-primary | 15 / 22 / 400 / 0 | "Eligible to return in-store for credit." | Archivo | `primary` |
| label-lg | 15 / 22 / 600 / 0 | "Log in" | Archivo | `primary` |
| label | 14 / 20 / 600 / 0 | "Add to cart" | Archivo | `primary` |
| text-secondary | 13 / 18 / 400 / 0 | "11 items · Sep 10, 2025" | Archivo | `secondary` |
| label-sm | 13 / 18 / 600 / 0 | "Qty" | Archivo | `primary` |
| overline | 11 / 14 / 700 / 0.1em / caps | "Trending" | Archivo | `accent-pressed` |
| mono | 13 / 18 / 400 / 0 | "c175679077816140" | IBM Plex Mono | `primary` |

> **Note (verbatim):** "Headings set tight and heavy; body stays 400 at generous leading. Sentence case everywhere except flags and section overlines. Product names use 600 with the material/variant word in Ink 500 at the same size."

---

## 03 · Spacing, radius & layout

### Spacing scale

| Token | px | Usage |
|---|---|---|
| space-0.5 | 2 | icon nudge |
| space-1 | 4 | label to value |
| space-2 | 8 | chip gap, swatch gap |
| space-3 | 12 | list row padding |
| space-4 | 16 | screen gutter (default) |
| space-5 | 20 | card padding |
| space-6 | 24 | heading to content |
| space-8 | 32 | section gap |
| space-10 | 40 | block break |
| space-16 | 64 | empty-state inset |

### Radius

| Value | Usage |
|---|---|
| 0 | tiles, images |
| 4 | checkbox |
| 8 | filter chip, input |
| 12 | card, sheet |
| full (999px) | search, button |

### Grid

```
gutter    16
content   358 @390
columns   4 (fluid)
tiles     2-up, gap 2
tile      3:4 image
rows      min 44 tap
```

### Breakpoints

```
sm    320–359
base  360–389
md    390–429
lg    430–743
tab   744+ → 3-up tiles
```

> **Note (verbatim):** "Product tiles bleed to the screen edge: the 16px gutter is suspended for image grids and hero media, restored for all text and controls. Bars are separated by 1px #E4E6E8 hairlines rather than shadows."

---

## 04 · Elevation

| Level | box-shadow | Radius (as shown) | Usage |
|---|---|---|---|
| e0 · flat | none + 1px border (`#E4E6E8`) | — | bars, tiles |
| e1 · resting card | `0 1px 2px rgba(16,17,18,.06)` | 12px | resting card |
| e2 · raised | `0 2px 8px rgba(16,17,18,.08)` | 12px | raised |
| e3 · dropdown | `0 8px 24px rgba(16,17,18,.10)` | 12px | dropdown |
| e4 · modal / sheet | `0 16px 40px rgba(16,17,18,.16)` | 16px | modal / sheet · scrim `rgba(16,17,18,.45)` |

---

## 05 · Iconography

Outline only, **1.75px stroke**, round caps and joins, drawn on a **24px grid** with a **2px safe margin**. Fill is used solely for a selected state (saved item, completed step). Every text input pairs with the mic glyph so any field can be dictated rather than typed. Icons inherit text colour; never accent unless the state is accent. Secure fields carry a `show`/`hide` toggle in the mic's position instead.

### Sizes

| Token | px | Usage |
|---|---|---|
| icon-sm | 16 | inline with body |
| icon-md | 20 | inputs, chips |
| icon-lg | 24 | bars, tabs |
| tap target | 44 minimum | — |

### Icon list (name — description of glyph)

- **search** — magnifying glass (circle + diagonal handle)
- **cart** — shopping cart outline with two wheels
- **save** — heart outline (unfilled)
- **saved** — heart, filled state (selected)
- **filters** — three horizontal sliders with circular handles
- **dictate** — microphone glyph (used in every text input for voice dictation)
- **account** — person-in-circle
- **back** — left chevron
- **chevron** — down chevron (expand/collapse)
- **show** — eye outline (reveal the value of a secure field)
- **hide** — eye outline with a diagonal slash (conceal the value of a secure field)

---

## 06 · Components

### Buttons

Spec line: `h 52 (lg) / 44 (md) / 36 (sm) · radius full · label 15/600 · padding 0 24`

| Variant / State | Height | Radius | Background | Text/Border color | Notes |
|---|---|---|---|---|---|
| Primary / default | 52 | full | `#101112` | `#FFFFFF` text | "Add to cart" |
| Primary / hover | 52 | full | `#2E3133` | `#FFFFFF` text | |
| Primary / pressed | 52 | full | `#2E3133` | `#FFFFFF` text | `transform: scale(0.97)` |
| Primary / disabled | 52 | full | `#E4E6E8` | `#9BA0A5` text | |
| Secondary / default | 52 | full | `#FFFFFF` | border 1.5px `#101112`, text `#101112` | "Find in store" |
| Secondary / pressed | 52 | full | `#F1F2F3` | border 1.5px `#101112`, text `#101112` | |
| Secondary / focus | 52 | full | `#FFFFFF` | border 1.5px `#101112` + `box-shadow: 0 0 0 3px #2F6BD8` | focus ring 3px `info` solid |
| Secondary / disabled | 52 | full | `#FFFFFF` | border 1.5px `#C9CDD1`, text `#9BA0A5` | |
| Small (sm) | 36 | full | `#101112` | `#FFFFFF` text, 13px/600 | "Small" example |
| Destructive | 44 | full | `#C4291F` | `#FFFFFF` text, 15px/600 | "Cancel order" |
| Text link / default | — | — | none | `#101112`, 15px/600, 1.5px underline | "Size guide" |
| Text link / disabled | — | — | none | `#9BA0A5`, 15px/600 | |
| Social / default | 52 | full | `#FFFFFF` | border 1.5px `#8C9297`, text `#101112` | 20px brand mark leading, gap 8, mark+label centred as one group · "Continue with Apple" |
| Social / pressed | 52 | full | `#F1F2F3` | border 1.5px `#8C9297`, text `#101112` | |
| Social / disabled | 52 | full | `#FFFFFF` | border 1px `#E4E6E8`, text and mark `#9BA0A5` | |

### Inputs

Spec line: `search: h 52, radius full, bg #F1F2F3, no border · field: h 52, radius 8, 1px #8C9297 · every field carries a 20px mic for dictation`

| Variant / State | Height | Radius | Background | Border | Notes |
|---|---|---|---|---|---|
| Search / rest | 52 | full (999px) | `#F1F2F3` | none | search icon `#6B7075` + mic icon `#101112`, placeholder "Search Allora" |
| Search / active (typing) | 52 | full | `#FFFFFF` | 1.5px `#101112` | text cursor shown as `#2F6BD8` bar; "Clear" label `#6B7075` 13px/600 |
| Field / rest | 52 | 8 | `#FFFFFF` | 1px `#8C9297` | label 15px/600 `#101112` above; trailing 32px circular mic button |
| Field / error | 52 | 8 | `#FFFFFF` | 1.5px `#C4291F` | label turns `#C4291F`; error message 15px `#C4291F` below (e.g. "Enter a complete postal code") |
| Field / secure (password) | 52 | 8 | `#FFFFFF` | 1px `#8C9297` | no mic; trailing 32px circular visibility toggle — `show` glyph while concealed, `hide` while revealed, 20px in `#6B7075` |
| Field / required | 52 | 8 | `#FFFFFF` | 1px `#8C9297` | label row is `Label` + the word `Required` in `#6B7075` 15/400, gap 8 |

### Divider

Spec line: `rule 1px border · centred label · gap 12 either side · block margin 24 0`

| Variant | Rule | Label | Usage |
|---|---|---|---|
| Plain | 1px `#E4E6E8`, full width | — | separates sections inside a sheet or form |
| Labelled ("OR") | 1px `#E4E6E8` each side, each `flex: 1` | `overline` ramp (11/700 caps, 0.1em) in `secondary` — **not** the `accent-pressed` default | separates two alternative paths, e.g. the email form and the social providers |

### Filter chips, dropdown, toggle, checkbox

| Component | Dimensions | Colors | Notes |
|---|---|---|---|
| Icon-only filter chip | 44×52, radius 8 | border `#8C9297`, bg `#FFFFFF` | sliders icon |
| Filter chip (dropdown, default) | h 44, radius 8 | border `#8C9297`, bg `#FFFFFF`, text 15/500 `#101112` | e.g. "Sort: Relevance" + chevron |
| Filter chip (selected) | h 44, radius 8 | border 1.5px `#101112`, bg `#F1F2F3`, text 15/600 `#101112` | e.g. "Size · 2" |
| Filter chip (disabled) | h 44, radius 8 | border 1px `#E4E6E8`, bg `#FFFFFF`, text `#C9CDD1` | e.g. "Colour" |
| Dropdown panel | radius 12, e3 shadow | bg `#FFFFFF`, border 1px `#E4E6E8` | header row 13/600 uppercase `#6B7075`; selected row shows `✓` in `#B62E22`; hovered/next row bg `#F7F8F8`; disabled row text `#C9CDD1` |
| Toggle / Off | 52×32, radius full | track `#E4E6E8`, border 1px `#8C9297`, knob 26×24 `#FFFFFF` w/ shadow `0 1px 2px rgba(16,17,18,0.2)` | padding 3px |
| Toggle / On | 52×32, radius full | track `#101112`, knob 26×24 `#FFFFFF` (knob right-aligned) | e.g. "On · pickup only" |
| Checkbox / unchecked | 22×22, radius 4 | border 1.75px `#101112` | "Compare" |
| Checkbox / checked | 22×22, radius 4 | bg `#101112`, `✓` glyph `#FFFFFF` 13px | "Selected" |

### Badges & tags

| Component | Height/size | Radius | Colors | Notes |
|---|---|---|---|---|
| Flag/overline "Trending" | text row | — | dot `#D33A2C`, text `#B62E22` 11/700 uppercase, 0.1em ls | |
| Badge "Final sale" | 24 | 4 | bg `#101112`, text `#FFFFFF` 11/700 uppercase 0.06em | |
| Badge "In stock" | 24 | 4 | bg `#E8F3EC`, text `#197A4B` 11/700 uppercase | |
| Badge "Low stock" | 24 | 4 | bg `#FBF2E3`, text `#8A5300` 11/700 uppercase | |
| Badge "Sold out" | 24 | 4 | bg `#F1F2F3`, text `#6B7075` 11/700 uppercase | |
| Tag (pill, e.g. "Nulu") | 24 | full | border 1px `#8C9297`, text `#2E3133` 13px | |
| Count badge (numeric, e.g. "3") | 18×18 | full | bg `#D33A2C`, text `#FFFFFF` (IBM Plex Mono 10px) | also used as cart badge, 16×16, positioned top -3px right -5px |

### Product tile

Spec line: `radius 0 · image 3:4 on #ECEDEE · 2px inter-tile gap · meta stack gap 8 · save button 36 circle, white 90% · selected swatch = 1.75px ink ring + 1.5px white inset`

- Image: `aspect-ratio: 3/4` on placeholder `#ECEDEE`/`#F4F5F5` diagonal stripe pattern, radius 0.
- Save button: 36px circle, `rgba(255,255,255,0.9)` background, positioned top 10px / right 10px, heart icon (outline default, filled when saved with `fill: #101112`).
- Colour swatches: 26×26 circles (24×24 in narrower grid layout), gap 8; selected swatch = `box-shadow: 0 0 0 1.5px #FFFFFF inset, 0 0 0 1.75px #101112`.
- Meta stack (gap 8): trending flag → title (16px/600 `#101112` + variant word `#6B7075`/400) → price (15px `#2E3133`; sale price `#C4291F` 600 with strikethrough original in `#6B7075` 13px) → compare checkbox row.
- Inter-tile gap: 2px, grid `1fr 1fr`.

### Order card & progress

- Card: radius 12, `box-shadow: 0 1px 2px rgba(16,17,18,0.06)`, border 1px `#E4E6E8`, bg `#FFFFFF`.
- Layout: `104px 1fr` grid — image placeholder, then padding 16 20 with title 17/600 `#101112`, progress bar, caption 13px `#6B7075`.
- Progress bar (step indicator): 4px height segments, active segment `#2F6BD8`, inactive `#E4E6E8`; 22×22 circular checkmark node `#2F6BD8` bg / `#FFFFFF` check.
- Shipment progress bar (linear): track `#B9CDF2`, fill `#2F6BD8`, height 4, radius 0.

### Modal / bottom sheet

Spec line: `sheet radius 16 top · grabber 40×4 · scrim rgba(16,17,18,.45) · enter 240ms cubic-bezier(.2,0,0,1)`

- Sheet: `border-radius: 16px 16px 0 0`, `box-shadow: 0 -16px 40px rgba(16,17,18,0.16)`, bg `#FFFFFF`, padding `12px 20px 20px`.
- Grabber: 40×4, radius full, `#C9CDD1`, centered, margin `0 auto 16px`.
- Header row: title 22/700 `-0.02em` `#101112` + "Size guide" link 13/600 `#6B7075`.
- Size grid cells: 5-column, 48px height, radius 8; default border 1px `#8C9297` text 15/500; selected border 1.5px `#101112` + bg `#101112` text `#FFFFFF` 15/600; sold-out cell border 1px `#E4E6E8` bg `#F7F8F8` text `#C9CDD1`.
- Primary CTA inside sheet: 52 height, radius full, `#101112` bg, `#FFFFFF` text — "Add to cart · $128".

### Pagination & load state

- Page number buttons: 44×44, radius 8; current page bg `#101112` text `#FFFFFF` 15/600; other pages border 1px `#8C9297` text `#101112`; disabled/next-arrow border 1px `#E4E6E8` icon `#C9CDD1`; ellipsis `…` in `#6B7075`.
- "Load 24 more" button: height 44, padding 0 22, radius full, border 1.5px `#101112`, text 15/600 `#101112`.
- Carousel dots: active 22×4 pill `#101112`; inactive 8×4 pill `#C9CDD1`; radius full.

> **Note (verbatim):** "mobile default is infinite scroll with 'Load 24 more' fallback; numbered pagination only in order history"

---

## 07 · Navigation

### Top bar

Spec line: `top bar h 56 · 1px #E4E6E8 hairline · title 17/600 centred, wordmark left-aligned on root screens`

- Root screen top bar: height 56, bg `#FFFFFF`, bottom border 1px `#E4E6E8`; wordmark "allora" 22/800 `-0.03em` `#101112` left-aligned; cart icon right with numeric badge (16×16 `#D33A2C`).
- Sub-screen top bar: height 56, back chevron left, centered title (17/600 `#101112`) + subtitle (13px `#6B7075`), cart icon with badge right.

### Scroll tabs

Spec line: `scroll tabs h 48 · label 17/600 · active = primary + 3px accent indicator, inactive secondary`

- Tab bar container: border 1px `#E4E6E8`, gap 24 between tabs, padding `0 16px`.
- Active tab: 17/600 `#101112`, bottom border 3px `#D33A2C`.
- Inactive tab: 17/500 `#6B7075`.
- Example tabs: For You, New, Women, Men, Home.

### Bottom tab bar

Spec line: `tab bar h 56 + 34 safe area · icon 24 · label 11/600 · active fills icon & primary label`

- Height 60 (56 + safe area accommodation shown as 60/24 split), bg `#FFFFFF`, top border 1px `#E4E6E8`.
- Icons 24px, active icon stroke `#101112` (filled where relevant), label 11/700 `#101112`; inactive icon/label stroke & text `#6B7075` 11/500.
- Tabs: Shop, Drops, Sellers, Saved, Account.
- Home indicator: 134×5 pill `#101112`, centered, in 24–26px bottom strip.

---

## 08 · Interaction states

| State | Treatment | Motion |
|---|---|---|
| Hover | Pointer only. Fill darkens one step (#101112 → #2E3133); outlined and ghost surfaces take #F7F8F8. Tile image scales 1.02 with overflow clipped. | 120ms ease-out |
| Pressed | Primary scale 0.97; outlined fills #F1F2F3; list rows flash #F7F8F8. Touch feedback is the only state on mobile. | 80ms in / 160ms out |
| Focus | 3px solid `info` #2F6BD8 outer ring, 2px offset, radius follows the control. Never removed for keyboard or switch control. | instant |
| Selected | 1.5px `primary` border and `surface-sunken` fill on chips and size cells; filled glyph on tabs and save; 3px `accent` indicator on scroll tabs. | 140ms ease-out |
| Disabled | Fill #E4E6E8 / label #9BA0A5; outlined drops to #E4E6E8 border. No opacity fades. Sold-out sizes keep a hairline and #F7F8F8 fill. | none |
| Loading | Skeletons in #F1F2F3 at the final geometry, 1.4s shimmer to #F7F8F8. Buttons keep width and swap the label for a 20px ring. | 1400ms loop |
| Error | 1.5px #C4291F border, 13px message below the field, label turns #C4291F. Toasts sit above the tab bar for 4s. | no shake |

---

## 09 · The system in use

Five screens at 390 × 844, built only from the tokens above.

### 01 · Discover
Status bar (h 48, bg `#F7F8F8`) → root top bar (h 56, wordmark + cart badge, bg `#F7F8F8`, border-bottom `#E4E6E8`) → greeting block: display "Hi Alex" + body-lg subcopy → search bar (h 52, pill, `#F1F2F3`, "Search or tap to speak" + mic icon) → scroll tabs (For You active w/ 3px Signal underline; New, Women, Men, Ho…) → "Your recent order" h2 heading → order card (progress bar w/ Tide fill, "Processing · arrives Sep 14") → full-bleed hero banner (220px, diagonal placeholder, "Editor's pick" badge top-left) → bottom tab bar (Shop active) → home indicator.

### 02 · Product grid (marketplace page)
Status bar → sub-screen top bar (back chevron, "shell jacket" title + "11 items" subtitle, cart icon) → search bar → pickup toggle row (toggle off + "Ready in 2 hours near **Mount Pleasant**" with chevron) → filter chip row (sliders icon chip, "Sort: Relevance", "Size · 2" selected, "Col…") → 2-up product tile grid (Ridge Shell/Nulu $128 trending; Ridge Shell/Luon $99 sale w/ Low stock badge; two placeholder tiles) → bottom tab bar → home indicator.

### 03 · Purchase details
Status bar (bg `#FFFFFF` on `#F7F8F8` frame) → sub-screen top bar ("Purchase details") → order meta row (Order ID mono `c1756790778`, Date "Sep 10, 2025", Total "1 item") → h1 "We've received your order" + progress stepper (Tide track/fill) + body copy → order line-item card (image, "Everyday Ribbed Crew Socks", Colour/Size/Qty rows, "Final sale" badge, price $14.00 strikethrough → $9.00 USD, return-eligibility note) → summary panel (bg `#F7F8F8`, Subtotal/Total tax/Shipping FREE `#197A4B`/Total $9.84 USD) → bottom tab bar → home indicator.

### 04 · Sign in
Back button (44 circle, `back` glyph, top-left) → h1 "Log in to Allora" → Email field (label "Email",
placeholder "hello@company.com", mic) → Password field (label "Password", placeholder "Your password",
visibility toggle) → "Forgot password?" text link, left-aligned → Primary button "Log in" (full width,
52) → labelled divider "OR" → Social "Continue with Apple" → Social "Continue with Google" → footer
row "New to Allora?" (`text-primary`) + text link "Create an account" (`label-lg`).

### 05 · Sign up
Back button → h1 "Get your free account" → Social "Continue with Apple" → Social "Continue with
Google" → labelled divider "OR" → Email field (label "Email" + `Required`, mic) → Primary button
"Continue with Email" → footer row "Already have an account?" (`text-primary`) + text link "Log in"
(`label-lg`).
