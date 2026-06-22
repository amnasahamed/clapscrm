# ClapsCRM Design System

A clean, modern CRM dashboard built around a fresh green accent, generous whitespace, and soft rounded surfaces. The aesthetic is friendly and energetic but still professional — suited to education sales teams managing enquiries, demos, and joinings.

---

## 1. Color Palette

### Brand / Accent

| Token | Hex | Usage |
|---|---|---|
| Primary Green | `#9BCC1A` / `#A4D720` | Primary buttons, active nav, KPI highlights, links |
| Lime Gradient | `#B6E62E → #8CC011` | Hero stat band (Collection), profile header, primary CTAs |
| Deep Forest | `#2A332B` / `#2C3A2E` | Sidebar footer profile, team leaderboard panel, dark KPI strip |

### Neutrals

| Token | Hex | Usage |
|---|---|---|
| Canvas / Cream | `#FBF6EE` | App background outside cards (`brand-bg`) |
| Surface White | `#FFFFFF` | Cards, sidebar, header, modals |
| Off-white Fill | `#F6F7F4` | Search field, inactive nav hover, recessed trays |
| Text Primary | `#1F2421` | Headings, lead names, key numbers |
| Text Secondary | `#8A8F8A` | Labels, captions, table metadata |
| Border / Divider | `#EDEFEA` | Hairline separators, table rows, card borders |

### Status / Semantic

| Token | Hex | ClapsCRM usage |
|---|---|---|
| Success | `#7FB800` | JOINED leads, COMPLETED demos, positive deltas, accept actions |
| Warning / Amber | `#F4B740` | NEW leads, NO_SHOW demos, pending transfer banners |
| Info / Blue | `#3B82F6` | IN PROGRESS leads, SCHEDULED / RESCHEDULED demos |
| Danger | `#E5484D` | LOST leads, CANCELLED demos, delete / sign-out |
| Hot lead | `#F4B740` ring | Star / hot indicator on high-priority enquiries |

#### Lead status chips

| Status | Chip style |
|---|---|
| **NEW** | Amber fill · amber text |
| **IN PROGRESS** | Blue fill · blue text |
| **JOINED** | Green fill · green text |
| **LOST** | Red fill · red text |

#### Demo status chips

| Status | Chip style |
|---|---|
| **Scheduled** | Blue chip |
| **Completed** | Green chip |
| **Rescheduled** | Blue / muted chip |
| **No Show** | Amber chip |
| **Cancelled** | Red chip |

#### Transfer / task states

| State | Chip style |
|---|---|
| Pending transfer | Amber banner + white secondary button |
| Task complete | Green swipe action / check icon |
| Task pending | Muted checkbox · forest text |

---

## 2. Typography

- **Family:** Plus Jakarta Sans (already loaded in `src/index.css`).
- **Hierarchy:**

| Role | Size | Weight | Example |
|---|---|---|---|
| Page title | 20–28px | Semibold | "Insights", "Hi, Sarah" |
| Card title | 14–18px | Semibold | "Tasks & follow-ups", "Team performance" |
| KPI number | 20–28px | Bold, tabular-nums | `₹12.4k`, `37%`, lead counts |
| Body / table | 14px | Regular / medium | Lead rows, demo agenda |
| Label / caption | 12px | Medium, secondary color | Date stamps, column headers |
| Section nav label | 10–11px | Semibold, uppercase tracking | Admin tab groups (optional) |

- **Tone:** Tight letter-spacing on numbers; comfortable line height on notes and WhatsApp templates.

---

## 3. Layout & Structure

### Desktop (≥768px)

```
┌──────────────┬─────────────────────────────────────────────┐
│  Sidebar     │  Sticky header (search · page context)      │
│  ~240–260px  ├─────────────────────────────────────────────┤
│  white       │  Main canvas (cream) · max-width 1400px     │
│              │  ┌─────────────┬─────────────┐              │
│  Nav items   │  │  Card grid  │  Card grid  │              │
│              │  └─────────────┴─────────────┘              │
│  ─────────   │  Optional forest panel for leaderboard      │
│  Profile     │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

1. **Left sidebar** — white, ClapsCRM logo + Zap icon, nav links, profile + sign-out footer.
2. **Main content** — fluid on cream canvas; page padding `16–32px`.
3. **Forest accent zones** — use on Home leaderboard, Collection KPI strip, or a future right rail for counselor profile / earnings.

### Mobile (<768px)

- **Top bar:** Page title or back arrow (enquiry form).
- **Bottom tab bar:** Home · Leads · Demos · Settings · More (Admin + Insights).
- **FAB:** Green primary, bottom-right on Leads (`+` new enquiry).
- **Bottom sheets:** Command palette search, More nav, lead detail, filters.

### Screen-specific grids

| Screen | Layout |
|---|---|
| **Home** | Full-width stat bar → 2-up cards (Tasks · Team performance) |
| **Leads** | Toolbar + list table or kanban columns (`NEW` → `LOST`) |
| **Demos** | Agenda list / kanban / calendar toggle |
| **Insights** | 4-up KPI row → 2-up charts → full-width funnel |
| **Admin** | Horizontal tab strip → section content |
| **Settings** | Stacked form cards (WhatsApp templates, PIN) |
| **Login** | Centered card on cream canvas |
| **Enquiry** | Single-column form, sticky submit |

**Spacing:** 16–24px gutters between cards; cards float on cream with breathing room.

---

## 4. Surfaces & Elevation

| Surface | Spec |
|---|---|
| **Cards** (`surface-panel`) | White, `border-radius: 16–18px`, soft shadow `0 8px 24px rgba(0,0,0,0.04)`, border `#EDEFEA` |
| **Hero stat band** | Lime gradient background; Collection metric highlighted in forest or inverted white |
| **Forest panels** | `#2A332B` background, white text, rounded 18px — team leaderboard, profile block |
| **Recessed tray** | `#F6F7F4` fill for filter bars, segmented controls |
| **Modals / sheets** | White, 28px top radius on mobile sheets, 28px all corners on desktop |
| **Pills & chips** | `border-radius: 999px` for status, nav active state, delta badges |

Replace the current flat zinc shadow (`shadow-sm`) with the softer card shadow on primary content panels.

---

## 5. Components

### Navigation

- **Desktop active item:** Light-green pill (`#E8F5C8` bg) + green text/icon — not solid black.
- **Desktop inactive:** Muted gray icon + label; hover `#F6F7F4`.
- **Mobile active tab:** Green-tinted pill behind icon (Motion `layoutId="mobile-nav-pill"`).
- **Overflow (More):** Bottom sheet listing Admin · Insights with same active styling.
- **Logo mark:** Green gradient square with white Zap icon (replacing `#18181b` block).

Nav items (permission-gated):

| Label | Path | Roles |
|---|---|---|
| Home | `/` | All |
| Leads | `/leads` | All |
| Demos | `/demos` | All |
| Settings | `/settings` | All |
| Admin | `/admin` | Admin |
| Insights | `/analytics` | Admin, Manager |

### KPI / Stat Cards

**Home stat bar** (Enquiries · Demos done · Joinings · Conversion · Collection):

- Label + big number; Collection column uses lime gradient or forest invert.
- Optional inline sparkline for weekly joinings (future).

**Insights row** (Total leads · Conversions · Demos completed · Conversion rate):

- 2×2 on mobile, 4-up on desktop inside a single `surface-panel`.

### Charts (Insights screen)

| Chart | Style |
|---|---|
| **Growth timeline** (area) | Green stroke for Conversions, forest stroke for Leads; soft gradient fills; minimal gridlines |
| **Lead sources** (bar) | Green primary bar; lighter green tints for secondary sources — avoid zinc grayscale |
| **Conversion funnel** | Stepped bars narrowing left-to-right; green fill intensity increases toward JOINED |

Tooltips: white bubble, 10px radius, `#EDEFEA` border, semibold label.

### Tables & Lists

Used on Leads (list view), Home (leaderboard), Admin (access logs):

- Light header row, 44px+ row height on mobile.
- Left-align name / date; right-align collection amounts (`₹` prefix, tabular-nums).
- Current user row: subtle green tint `#F6FAEF`.
- "View all" / export links in accent green.

### Leads board

- Kanban columns: `NEW` · `IN PROGRESS` · `JOINED` · `LOST`.
- Column headers show count badge.
- Cards: white, soft shadow, status chip, hot-star amber, swipe actions on mobile.
- Drag placeholder: green ring at 20% opacity.

### Demos agenda

- Date group headers ("Today", "Tomorrow").
- Status chip per row; join-meet link in green.
- Calendar cells: dot indicators — green (completed), blue (scheduled), amber (no-show).

### Buttons

| Variant | Style |
|---|---|
| **Primary** | Green fill `#9BCC1A`, white text, 12px radius — "Accept transfer", "Save templates", FAB |
| **Secondary** | White + border, forest text |
| **Destructive** | Red text on red-50 hover — delete lead, sign out |
| **Ghost** | Muted text, green on hover — "Clear completed", "View all" |

Icon-leading for WhatsApp, schedule demo, add lead.

### Search / Command palette

- Trigger: off-white fill, rounded-xl, ⌘K badge on desktop.
- Results: lead name bold, phone + class muted; status chip right-aligned.
- Overlay: `rgba(42, 51, 43, 0.4)` + blur (forest-tinted scrim).

### Avatars & Profile

- Circular avatar, thin green ring when active / current user.
- Sidebar footer: name + role caption.
- Leaderboard: rank number, avatar, name; top 3 ranks in forest green.

### Modals & sheets

Shared patterns (`ConfirmationModal`, `BottomSheet`, `OverlayShell`):

- Title semibold; subtitle secondary.
- Primary action green; cancel ghost.
- Mobile: bottom sheet with drag handle `#d4d4d8` on `#EDEFEA`.
- Swipe actions: green (complete), red (delete) — keep existing behavior, update colors.

### Forms (Enquiry, Settings)

- Inputs: off-white fill at rest → white + green focus ring on focus.
- Labels: 12px medium secondary, or 10px uppercase for settings sections.
- Textareas: rounded-2xl, relaxed line height for WhatsApp template variables.

---

## 6. Iconography

- **Library:** Lucide React (already in use).
- **Stroke:** ~1.8px inactive, 2–2.5px active.
- **Size:** 18–20px inline; 22–24px FAB / header.
- **Color:** Muted `#8A8F8A` when inactive; `#9BCC1A` or white when active/on green surfaces.

Common mappings:

| Icon | Context |
|---|---|
| `Users` | Leads |
| `Video` | Demos |
| `BarChart3` | Insights |
| `Bell` | Tasks / reminders |
| `MessageCircle` | WhatsApp |
| `Star` | Hot lead |
| `ShieldCheck` | Admin |

---

## 7. Motion

Already using Motion (`motion/react`):

| Pattern | Spec |
|---|---|
| Page enter | `opacity 0→1`, `y 12→0`, 300ms ease `[0.16, 1, 0.3, 1]` |
| Stagger children | 80ms between cards |
| Mobile nav pill | Spring, bounce 0.2 |
| Interactive press | `active:scale-[0.98]` (`.interactive-element`) |
| Bottom sheet | Spring slide-up; scrim fade |

Keep motion subtle — CRM users interact all day; avoid distracting loops.

---

## 8. Design Principles

1. **Single bold accent** — one confident green carries ClapsCRM identity; status colors stay semantic.
2. **Soft & rounded** — large corner radii and gentle shadows for an approachable counseling workflow.
3. **Whitespace-forward** — pipeline data floats on warm cream; dense tables breathe with row height.
4. **Light/dark contrast zones** — forest panels separate "people" (team, profile) from "pipeline" (leads, charts).
5. **Data clarity first** — conversion and collection numbers are scannable; color encodes status, not decoration.
6. **Mobile-first actions** — swipe, FAB, and bottom sheets for counselors in the field.
7. **Friendly professionalism** — energetic green tempered by structured grids and Plus Jakarta Sans.

---

## 9. Tailwind Token Migration

Target `@theme` block for `src/index.css` (maps legacy `brand-*` names to new palette):

```css
@theme {
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;

  /* Brand */
  --color-brand-primary: #9BCC1A;
  --color-brand-primary-hover: #8CC011;
  --color-brand-accent: #9BCC1A;
  --color-brand-forest: #2A332B;
  --color-brand-forest-muted: #3D4A3F;

  /* Neutral */
  --color-brand-bg: #FBF6EE;
  --color-brand-card: #FFFFFF;
  --color-brand-fill: #F6F7F4;
  --color-brand-border: #EDEFEA;
  --color-brand-text-main: #1F2421;
  --color-brand-text-sub: #8A8F8A;

  /* Semantic */
  --color-brand-success: #7FB800;
  --color-brand-warning: #F4B740;
  --color-brand-danger: #E5484D;
  --color-brand-info: #3B82F6;

  /* Shape */
  --radius-brand-card: 18px;
  --radius-brand-inner: 12px;
  --radius-brand-pill: 999px;

  /* Elevation */
  --shadow-brand-card: 0 8px 24px rgba(0, 0, 0, 0.04);
}
```

### CSS custom properties (quick reference)

```css
:root {
  /* Brand */
  --green-500: #9BCC1A;
  --green-600: #8CC011;
  --green-grad: linear-gradient(135deg, #B6E62E, #8CC011);
  --green-soft: #E8F5C8;
  --forest-900: #2A332B;

  /* Neutral */
  --canvas: #FBF6EE;
  --surface: #FFFFFF;
  --fill-muted: #F6F7F4;
  --text-primary: #1F2421;
  --text-secondary: #8A8F8A;
  --border: #EDEFEA;

  /* Semantic */
  --success: #7FB800;
  --warning: #F4B740;
  --danger: #E5484D;
  --info: #3B82F6;

  /* Shape */
  --radius-card: 18px;
  --radius-pill: 999px;
  --radius-btn: 12px;
  --shadow-card: 0 8px 24px rgba(0, 0, 0, 0.04);
}
```

### Utility class updates

| Class | Change |
|---|---|
| `.surface-panel` | Use `--shadow-brand-card`; border `#EDEFEA` |
| `.badge-green` | Tint `#E8F5C8` / text `#5A7A0A` / border `#C5E87A` |
| `.badge-orange` | Align to `--warning` for NEW leads |
| `.badge-blue` | Align to `--info` for IN PROGRESS |
| `.recessed-tray` | Background `--fill-muted` |
| `.premium-hover` | Hover border `#D8DDD0` (warm gray-green) |

---

## 10. Migration Checklist

When rolling out the new visual system:

- [ ] Update `@theme` tokens in `src/index.css`
- [ ] Replace hardcoded `#18181b` primary surfaces in `App.tsx` (nav active, FAB, logo)
- [ ] Swap `#f4f4f5` / `#e4e4e7` neutrals for cream / warm border tokens
- [ ] Re-theme Recharts in `Analytics.tsx` (green series, cream gridlines)
- [ ] Update `STATUS_COLORS` in `Leads.tsx` to pill chips with brand semantic tints
- [ ] Home Collection highlight: lime gradient band instead of black invert
- [ ] Login screen: green logo mark, cream background
- [ ] Chart tooltip / modal scrim: forest-tinted overlay
- [ ] Verify contrast on forest panels (WCAG AA for white on `#2A332B`)

---

## 11. Out of Scope (keep as-is)

- Role permissions and route guards
- Data models (`Lead`, `Demo`, `Reminder`, etc.)
- Swipe gesture thresholds and `@hello-pangea/dnd` behavior
- WhatsApp template variable syntax

Visual tokens and component styling only — no business-logic changes.
