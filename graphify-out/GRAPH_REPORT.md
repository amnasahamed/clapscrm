# Graph Report - /Users/amnasahamed/Desktop/crm  (2026-06-23)

## Corpus Check
- Corpus is ~42,881 words - fits in a single context window. You may not need a graph.

## Summary
- 376 nodes · 802 edges · 30 communities (18 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Modals and Overlays|Modals and Overlays]]
- [[_COMMUNITY_Dependencies and Scripts|Dependencies and Scripts]]
- [[_COMMUNITY_Dashboard Customization|Dashboard Customization]]
- [[_COMMUNITY_App Navigation & Auth Context|App Navigation & Auth Context]]
- [[_COMMUNITY_Analytics and Data Export|Analytics and Data Export]]
- [[_COMMUNITY_Demos and Actions|Demos and Actions]]
- [[_COMMUNITY_Access Control and Auth|Access Control and Auth]]
- [[_COMMUNITY_Data Types and Context|Data Types and Context]]
- [[_COMMUNITY_Admin Analytics Dashboard|Admin Analytics Dashboard]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Design System Principles|Design System Principles]]
- [[_COMMUNITY_Lead Access Management|Lead Access Management]]
- [[_COMMUNITY_App Entry Point|App Entry Point]]
- [[_COMMUNITY_Hero Illustration Asset|Hero Illustration Asset]]
- [[_COMMUNITY_Bluesky Icon Asset|Bluesky Icon Asset]]
- [[_COMMUNITY_Vercel Deployment Config|Vercel Deployment Config]]
- [[_COMMUNITY_React Logo Asset|React Logo Asset]]
- [[_COMMUNITY_Vite Logo Asset|Vite Logo Asset]]
- [[_COMMUNITY_Favicon Asset|Favicon Asset]]
- [[_COMMUNITY_Discord Icon Asset|Discord Icon Asset]]
- [[_COMMUNITY_Documentation Icon Asset|Documentation Icon Asset]]
- [[_COMMUNITY_GitHub Icon Asset|GitHub Icon Asset]]
- [[_COMMUNITY_Social Icon Asset|Social Icon Asset]]
- [[_COMMUNITY_X Icon Asset|X Icon Asset]]
- [[_COMMUNITY_Lead Sources Types|Lead Sources Types]]

## God Nodes (most connected - your core abstractions)
1. `useData()` - 33 edges
2. `useAuth()` - 27 edges
3. `Lead` - 23 edges
4. `useStaff()` - 19 edges
5. `compilerOptions` - 15 edges
6. `Z` - 12 edges
7. `Demo` - 11 edges
8. `useIsMobile()` - 9 edges
9. `UserRole` - 9 edges
10. `isInDateRange()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `ClapsCRM Project` --semantically_similar_to--> `ClapsCRM Design System`  [INFERRED] [semantically similar]
  README.md → DESIGN.md
- `AdminSourcesSection()` --calls--> `useData()`  [EXTRACTED]
  src/screens/admin/AdminSourcesSection.tsx → src/contexts/DataContext.tsx
- `MainLayout()` --calls--> `useScrollLock()`  [EXTRACTED]
  src/App.tsx → src/hooks/useScrollLock.ts
- `MainLayout()` --calls--> `filterViewableLeads()`  [EXTRACTED]
  src/App.tsx → src/utils/leadAccess.ts
- `AdminOffboardModal()` --calls--> `useData()`  [EXTRACTED]
  src/components/AdminOffboardModal.tsx → src/contexts/DataContext.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Tailwind Migration Affected Files** — crm_design_app_tsx, crm_design_analytics_tsx, crm_design_leads_tsx, crm_design_index_css [EXTRACTED 1.00]
- **SVG Icons Collection** — public_icons_bluesky_icon, public_icons_discord_icon, public_icons_documentation_icon, public_icons_github_icon, public_icons_social_icon, public_icons_x_icon [EXTRACTED 1.00]

## Communities (30 total, 12 thin omitted)

### Community 0 - "Modals and Overlays"
Cohesion: 0.07
Nodes (35): BottomSheet(), BottomSheetProps, maxWidthClass, EditLeadModal(), EditLeadModalProps, FilterLeadsModal(), FilterLeadsModalProps, LeadFilters (+27 more)

### Community 1 - "Dependencies and Scripts"
Cohesion: 0.06
Nodes (35): dependencies, dotenv, express, @google/genai, @hello-pangea/dnd, hls.js, lucide-react, motion (+27 more)

### Community 2 - "Dashboard Customization"
Cohesion: 0.12
Nodes (26): DashboardBackground(), DashboardBackgroundProps, POSTER_SRC, colorStops(), DASHBOARD_GRADIENTS, DashboardGradientOption, getDashboardGradientCss(), buildUnsplashUrl() (+18 more)

### Community 3 - "App Navigation & Auth Context"
Cohesion: 0.14
Nodes (19): AdminAcademicSection(), ScheduleDemoModal(), useAuth(), DataProvider(), useData(), useStaff(), useAppearancePrefs(), useIsMobile() (+11 more)

### Community 4 - "Analytics and Data Export"
Cohesion: 0.12
Nodes (21): AdminAccessLogsSection(), DATE_OPTIONS, AdminStaffPerformanceSection(), DATE_OPTIONS, computeMonthlyLeaderboard(), getLeadCollectedAmount(), downloadCsv(), CustomDateRange (+13 more)

### Community 5 - "Demos and Actions"
Cohesion: 0.09
Nodes (15): AdminSourcesSection(), AdminCatalogListProps, ConfirmationModal(), ConfirmationModalProps, DemoFilters, FilterDemosModal(), FilterDemosModalProps, SwipeableItemProps (+7 more)

### Community 6 - "Access Control and Auth"
Cohesion: 0.10
Nodes (25): AccessDenied(), AccessDeniedProps, ProtectedRoute(), ProtectedRouteProps, AuthContext, AuthContextType, AuthProvider(), buildDefaultStaff() (+17 more)

### Community 7 - "Data Types and Context"
Cohesion: 0.13
Nodes (23): DataContext, DataContextType, DataStorage, defaultTemplates, NotificationPermissionState, ReminderNotificationsResult, AccessLogEntry, ActivityEntry (+15 more)

### Community 8 - "Admin Analytics Dashboard"
Cohesion: 0.12
Nodes (20): AdminAnalyticsSection(), PeriodView, useReminderNotifications(), Home(), buildDailyTimeline(), buildMonthlyTimeline(), compareDailyPerformance(), compareMonthlyPerformance() (+12 more)

### Community 9 - "TypeScript Configuration"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 10 - "Design System Principles"
Cohesion: 0.13
Nodes (15): Analytics.tsx, App.tsx, ClapsCRM Design System, Color Palette, Components, Design Principles, Iconography, index.css (+7 more)

### Community 11 - "Lead Access Management"
Cohesion: 0.26
Nodes (10): AdminOffboardModal(), AdminOffboardModalProps, EnquiryForm(), ACTIVE_LEAD_STATUSES, getLeadOwnerName(), isActiveLeadStatus(), isLeadManagedBy(), isLeadOwner() (+2 more)

### Community 13 - "App Entry Point"
Cohesion: 1.00
Nodes (3): ClapsCRM HTML Entry, main.tsx script, root div

## Knowledge Gaps
- **123 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+118 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useData()` connect `App Navigation & Auth Context` to `Modals and Overlays`, `Dashboard Customization`, `Analytics and Data Export`, `Demos and Actions`, `Data Types and Context`, `Admin Analytics Dashboard`, `Lead Access Management`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `Lead` connect `Modals and Overlays` to `App Navigation & Auth Context`, `Analytics and Data Export`, `Access Control and Auth`, `Data Types and Context`, `Admin Analytics Dashboard`, `Lead Access Management`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `App Navigation & Auth Context` to `Modals and Overlays`, `Dashboard Customization`, `Demos and Actions`, `Access Control and Auth`, `Data Types and Context`, `Admin Analytics Dashboard`, `Lead Access Management`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _124 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Modals and Overlays` be split into smaller, more focused modules?**
  _Cohesion score 0.07474600870827286 - nodes in this community are weakly interconnected._
- **Should `Dependencies and Scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Dashboard Customization` be split into smaller, more focused modules?**
  _Cohesion score 0.11942959001782531 - nodes in this community are weakly interconnected._