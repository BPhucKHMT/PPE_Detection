# Figma Dev Prompt - PPE Detection Dashboard

Design a premium, production-ready web dashboard for an AI-powered PPE Detection and Worker Safety Monitoring system.

The system detects workers from uploaded videos or live camera feeds, assigns each person a tracking ID, checks whether they wear required PPE, and triggers alerts when PPE is missing.

Product name: **PPE Vision Control**

Create a high-fidelity desktop dashboard, 1440px wide. Do not include device frames.

## Visual Style

Use a modern industrial safety command-center style:

- Dark mode UI.
- Background: charcoal, graphite, dark navy, subtle blue-black gradients.
- Premium glassmorphism cards with soft borders.a
- Accent colors:
  - Cyan/blue for live AI monitoring.
  - Green for compliant workers.
  - Amber for warnings.
  - Red for critical PPE violations.
  - Purple/indigo for analytics.
- Typography: Inter, Satoshi, Geist, or similar modern SaaS font.
- The UI should feel enterprise-grade, not like a simple demo.

## Main Layout

Create one main dashboard screen with:

### 1. Top Navigation

Include:

- Logo + **PPE Vision Control**.
- Site selector: "Site A - Construction Zone".
- Status pill: "AI Monitoring Active".
- Model status: "YOLO11 · GPU Online".
- FPS indicator: "11.6 FPS".
- Notification bell.
- User avatar/settings.

### 2. Left Sidebar

Navigation items:

- Dashboard
- Realtime Monitor
- Video Upload
- Safety Alerts
- Worker Tracking
- Reports
- PPE Rules
- Settings

Highlight the active item with cyan/blue accent.

### 3. KPI Cards

Add dashboard metric cards:

- Workers Detected: 18
- Compliant Workers: 14
- Active Violations: 4
- Critical Alerts Today: 12
- Average Confidence: 91.8%
- Processing FPS: 11.6

Each card should have an icon, large number, label, and color-coded status.

### 4. Realtime Video Monitor

Make this the visual focus.

Show a large video preview panel of a construction/factory scene with AI overlays:

- Bounding boxes around workers.
- Tracking IDs like `ID #024`, `ID #031`, `ID #044`.
- Green boxes for compliant workers.
- Red boxes for missing PPE.
- Amber boxes for uncertain/warning state.
- PPE labels near workers:
  - Helmet OK
  - Vest OK
  - Helmet Missing
  - Gloves Missing
  - Low Confidence

Example:

- `ID #024`: red box, Helmet Missing, 92% confidence.
- `ID #031`: green box, Helmet OK, Vest OK, Gloves OK.
- `ID #044`: amber box, Gloves Missing, 78% confidence.

Video overlay should include:

- Camera: "Camera 03 - Loading Bay"
- LIVE indicator
- Resolution: 1280x720
- Latency: 96ms

Below video, add controls:

- Upload Video
- Start Realtime Preview
- Pause
- Snapshot
- Export Processed Video
- Toggle bounding boxes / tracking IDs / PPE labels

### 5. Live Safety Alerts Panel

Place on the right side of the video.

Title: **Live Safety Alerts**

Alert cards should show:

- Severity: Critical / Warning
- Tracking ID
- Missing PPE item
- Camera
- Timestamp
- Confidence score
- Evidence thumbnail
- Buttons: Acknowledge, View Frame

Example alerts:

- Critical: `ID #024` Helmet Missing, Camera 03, 92%, 19:24:08.
- Warning: `ID #044` Gloves Missing, Camera 01, 78%, 19:23:51.
- Critical: `ID #019` Safety Vest Missing, Camera 02, 89%, 19:22:44.

### 6. Worker Tracking Table

Create a table titled **Worker Tracking & PPE Compliance**.

Columns:

- Tracking ID
- Snapshot
- PPE Status
- Helmet
- Vest
- Gloves
- Mask
- Last Seen
- Camera
- Risk Level
- Action

Use chips:

- Green: OK
- Red: Missing
- Amber: Low confidence
- Gray: N/A

Add filters: All Workers, Violations Only, Critical Only, Camera, PPE Item.

### 7. Analytics Widgets

Add compact charts:

- Compliance ratio donut chart.
- Alerts over time line chart.
- Violation types bar chart.
- Model performance mini chart showing FPS and latency.

### 8. Video Upload Card

Include a drag-and-drop upload area:

"Upload MP4 / AVI / MOV for realtime PPE analysis"

Show states for uploading, processing, completed, and error.

### 9. Alert Detail Drawer

Include a side drawer concept opened from an alert:

- Evidence frame.
- Worker tracking ID.
- Missing PPE.
- Confidence score.
- Timestamp.
- Camera.
- Rule violated.
- Buttons: Mark Resolved, Export Evidence, Add Note.

## Final Goal

The final design should look like a credible AI safety monitoring product with realtime video detection, worker tracking IDs, PPE violation alerts, dashboard statistics, video upload, and reporting readiness.
