# Frontend Detailed Specification – PPE Vision Control

## 1) Document Goal
This document defines a production-ready frontend specification based on the current Figma direction and dashboard style. It focuses on the missing **page transition/navigation design** and detailed interaction rules so implementation can be consistent across pages.

---

## 2) Product Context
- **Product**: PPE Vision Control
- **Primary users**: Site supervisors, safety managers, control room operators
- **Main objective**: Monitor compliance in realtime, detect violations, and take quick action
- **Design language**: Dark, high-contrast, monitoring-first UI with clear alert hierarchy

---

## 3) Information Architecture (IA)

### Primary Navigation (Left Sidebar)
1. Dashboard
2. Realtime Monitor
3. Video Upload
4. Safety Alerts
5. Worker Tracking
6. Reports
7. PPE Rules
8. Settings

### Global Top Bar (Persistent)
- Site selector (e.g., Site A – Construction Zone)
- AI status pill (active/inactive)
- Model/runtime status + FPS
- Notification bell
- Settings shortcut
- User avatar/menu

---

## 4) Route Structure

| Route | Page | Purpose |
|---|---|---|
| `/dashboard` | Dashboard | Executive summary + key KPIs |
| `/monitor` | Realtime Monitor | Live streams + detection overlays |
| `/upload` | Video Upload | Upload files for offline analysis |
| `/alerts` | Safety Alerts | Alert feed, filters, actions |
| `/workers` | Worker Tracking | Worker-level tracking and status |
| `/reports` | Reports | Historical analytics and exports |
| `/rules` | PPE Rules | Rule config and thresholds |
| `/settings` | Settings | System/user/preferences |

### Default Route
- Authenticated user lands on `/dashboard`.
- Unknown route redirects to `/dashboard` with non-blocking toast: “Page not found. Redirected to Dashboard.”

---

## 5) Navigation & Transition Matrix (Core Missing Part)

## 5.1 Transition Principles
- Sidebar navigation is **instant route change** with smooth content transition.
- Keep sidebar/topbar persistent; only main content area transitions.
- Use transition timing: `180–240ms` for opacity/translate, ease-out.
- Avoid full-screen hard reload transitions.

## 5.2 Transition Types
1. **Primary route switch (sidebar click)**
   - Current page content fades out (120ms)
   - New page skeleton appears immediately
   - Data fills progressively

2. **Context switch (site selector change)**
   - Keep user on current route
   - Show inline loading state for cards/tables/charts
   - Display toast: “Context switched to Site X”

3. **Alert-driven deep navigation**
   - From alert card -> open related camera/worker details
   - Preserve back context (breadcrumb + browser back)

## 5.3 Navigation Matrix

| From | Trigger | To | Transition | Notes |
|---|---|---|---|---|
| Any page | Sidebar item click | Target route | Content fade + skeleton | Sidebar state persists |
| Dashboard | “View all alerts” | `/alerts` | Direct route | Apply prefilter `status=open` |
| Dashboard | Camera card click | `/monitor` | Direct route | Focus selected camera |
| Alerts | “View” on alert | `/monitor` | Deep-link route | Pass `cameraId`, `alertId` |
| Alerts | Worker name click | `/workers` | Deep-link route | Pass `workerId` |
| Reports | “Configure rules” CTA | `/rules` | Direct route | Keep date filter in memory |
| Any page | Topbar settings icon | `/settings` | Direct route | Keep return path |

---

## 6) Global UI State Model
All data-driven modules must support:

1. **Loading**
   - Use skeletons (card/table/video placeholder)
   - Never block whole app shell

2. **Empty**
   - Show actionable message, e.g.:
     - “No alerts in selected time range.”
     - CTA: “Adjust filters”

3. **Error**
   - Inline error card + retry action
   - Non-fatal errors should not break layout

4. **Offline / reconnecting**
   - Top-level network badge: “Reconnecting…”
   - Stream cards show paused state with retry

5. **No permission**
   - Replace restricted section with access message
   - Provide contact/admin action where possible

---

## 7) Detailed Page Specifications

## 7.1 Dashboard (`/dashboard`)
### Purpose
Fast operational overview for current site.

### Blocks
- KPI cards (workers, compliant, active violations, critical alerts, confidence, FPS)
- Realtime preview panel
- Live safety alerts panel

### Interactions
- KPI cards can open filtered reports or alerts
- Alert “View” opens monitor with specific alert context
- Realtime panel click opens full monitor page

### Page Entry Behavior
- Render shell + KPI skeletons first
- Load KPI summary and recent alerts in parallel

---

## 7.2 Realtime Monitor (`/monitor`)
### Purpose
Live visual monitoring and incident validation.

### Blocks
- Camera grid / focused stream
- Detection overlays (bounding boxes + labels)
- Stream metadata (camera name, resolution, latency)
- Incident side panel

### Interactions
- Switch camera from list/grid
- Toggle overlays (on/off)
- Click incident -> highlight frame timestamp

### Page Transition Detail
- If navigated from alert, auto-focus related camera and pulse-highlight incident row for 2s

---

## 7.3 Video Upload (`/upload`)
### Purpose
Batch/offline analysis for uploaded videos.

### Blocks
- Drag-drop upload zone
- Queue list with status (queued/processing/done/failed)
- Result links and summary

### Interactions
- Multi-file upload
- Retry failed item
- Cancel queued item

### State Rules
- Preserve queue state when user changes route and returns

---

## 7.4 Safety Alerts (`/alerts`)
### Purpose
Centralized alert triage and action.

### Blocks
- Alert table/card list
- Filters: severity, status, date, camera, type
- Quick actions: View, Acknowledge, Resolve

### Interactions
- Filter updates URL query params
- View -> `/monitor?cameraId=...&alertId=...`
- Acknowledge/Resolve updates row state optimistically

---

## 7.5 Worker Tracking (`/workers`)
### Purpose
Track worker safety compliance over time.

### Blocks
- Worker list/grid
- Worker detail panel
- Compliance timeline

### Interactions
- Search by name/ID
- Click worker -> detail page state within route
- Link from alerts opens same worker preselected

---

## 7.6 Reports (`/reports`)
### Purpose
Historical analytics and export.

### Blocks
- Date range filters
- Trend charts (violations, compliance, response time)
- Export actions (CSV/PDF)

### Interactions
- Filter changes trigger chart/table refresh
- Export uses active filters snapshot

---

## 7.7 PPE Rules (`/rules`)
### Purpose
Rule configuration and threshold management.

### Blocks
- Rule list by PPE type
- Enable/disable toggle
- Severity threshold controls

### Interactions
- Save changes with validation
- Show “unsaved changes” warning before route leave

---

## 7.8 Settings (`/settings`)
### Purpose
System/user preferences and platform controls.

### Sections
- Profile
- Notifications
- Site/model defaults
- Integration/system preferences

### Interactions
- Dirty form guard before leaving
- Success/error toast after save

---

## 8) Shared Component Contracts

## 8.1 Sidebar
- Persistent across all routes
- Active item highlight from current pathname
- Collapsible mode optional for smaller widths

## 8.2 Topbar
- Persistent
- Site selector triggers context reload only, not route reset

## 8.3 Alert Card
- Required fields: severity, timestamp, ID, type, source camera, confidence
- Actions: View, Acknowledge (if open), Resolve (if acknowledged)

## 8.4 KPI Card
- Required: title, value, unit/label, icon, trend(optional)
- Click behavior must be explicit (navigable or static)

---

## 9) Responsive Behavior
- **Desktop (>=1280px)**: Full sidebar + multi-column dashboard
- **Laptop (1024–1279px)**: Compact gaps, same structure
- **Tablet (768–1023px)**: Sidebar collapses to icon rail + drawer
- **Mobile (<768px)**: Focus mode (single-column), prioritize monitor/alerts actions

For final report scope, desktop and laptop are required baseline; tablet/mobile are adaptive but simplified.

---

## 10) Accessibility & UX Quality Baseline
- One `h1` per page
- Semantic landmarks (`header`, `nav`, `main`, `aside`)
- Keyboard navigation for sidebar/topbar/actions
- Focus-visible ring on interactive controls
- Color contrast compliant for alert badges and text on dark backgrounds
- Toasts must be screen-reader friendly (`aria-live="polite"`)

---

## 11) Performance & Realtime UX Rules
- First contentful shell should render quickly before data
- Avoid blocking transitions on API completion
- Use progressive rendering for streams and alert lists
- Debounce high-frequency UI updates (alert flood scenarios)

---

## 12) QA Checklist (Frontend)
1. Sidebar route highlight always matches active route
2. Page transition timing consistent (no abrupt flashes)
3. Deep-link from alert opens correct camera/alert context
4. Loading/empty/error states exist on every data module
5. Unsaved changes guard works in Rules/Settings
6. Site switch preserves current route and reloads context
7. Keyboard navigation works for major flows
8. No layout break at 1024px and 1280px breakpoints

---

## 13) Open Items To Confirm With Team
1. Final permission model (role matrix by page/action)
2. Exact API query params for filters and deep links
3. Whether mobile view is mandatory for final delivery
4. Alert lifecycle states and allowed transitions

---

## 14) Implementation Priority (Recommended)
1. App shell (sidebar + topbar + route framework)
2. Navigation transitions + route guards
3. Dashboard + Alerts + Monitor flow (core demo path)
4. Remaining pages with shared components
5. Accessibility/performance polish
