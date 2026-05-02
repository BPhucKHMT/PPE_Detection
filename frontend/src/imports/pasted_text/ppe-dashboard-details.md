# Figma Dev Follow-up Prompt - PPE Dashboard Details

Use this after the base prompt in `frontend.md`. Refine the existing PPE Vision Control dashboard with more production-ready details, states, and interactions.

## Product Context

The dashboard is for safety supervisors and factory/construction site operators. It should help them answer:

- How many workers are visible?
- Which worker is missing PPE?
- What is the tracking ID?
- Which PPE item is missing?
- How confident is the AI?
- Which camera saw the violation?
- Can the alert be acknowledged, reviewed, exported, or escalated?

## Advanced Realtime Video Details

Enhance the video monitor with realistic detection overlays:

- Each worker box should have a top label with tracking ID and confidence.
- PPE tags should be attached close to the worker, not randomly floating.
- Add a selected worker state, e.g. `ID #024` highlighted with brighter red glow.
- Add small AI overlay controls:
  - Show boxes
  - Show labels
  - Show confidence
  - Show tracking path
- Add mini performance overlay:
  - FPS: 8.8-12.0
  - Latency: 83-96ms
  - Backend: YOLO11 PT
  - Runtime: RTX 4060 GPU

Add a small timeline at the bottom of the video panel with red markers where violations occurred.

## Alert Workflow Details

Alert cards should look actionable and operational.

Each alert should include:

- Severity color strip.
- Evidence thumbnail.
- Worker ID.
- Missing item.
- PPE rule name.
- Confidence.
- Timestamp.
- Status: New / Acknowledged / Resolved.
- Buttons: Acknowledge, View Evidence, Escalate.

Add a hover/selected state where the corresponding worker in the video is highlighted.

Example alert:

"Critical · ID #024 · Helmet Missing · Loading Bay Helmet Rule · 92% · 19:24:08"

## Worker Detail Drawer

Design a right-side drawer for selected worker or selected alert.

Content:

- Evidence frame with bbox.
- Tracking ID.
- Current PPE status.
- List of detected PPE:
  - Helmet: Missing
  - Vest: OK
  - Gloves: OK
  - Mask: Not required
- Confidence score.
- Camera source.
- First seen / last seen.
- Violation duration.
- Recent detection history.
- Action buttons:
  - Mark Resolved
  - Export Evidence
  - Add Supervisor Note
  - Assign Follow-up

## PPE Rule Configuration Card

Add a compact rule configuration widget:

- Loading Bay: Helmet + Vest required, severity Critical, enabled.
- Welding Area: Helmet + Gloves + Glasses required, severity Critical, enabled.
- Medical Zone: Mask + Gloves required, severity Warning, enabled.
- Visitor Area: Helmet required, severity Warning, disabled.

Each rule should use PPE chips and an enabled toggle.

## Analytics Details

Make analytics realistic:

1. Compliance donut:
   - Compliant 78%
   - Warning 11%
   - Critical 11%

2. Alerts line chart:
   - Last 60 minutes.
   - Red spikes for critical alerts.
   - Amber spikes for warnings.

3. Violation bar chart:
   - Helmet Missing
   - Vest Missing
   - Gloves Missing
   - Mask Missing
   - Glasses Missing
   - Boots Missing

4. Model performance chart:
   - FPS trend.
   - Inference latency trend.
   - Average confidence.

## Upload and Processing States

Improve the upload card with states:

1. Empty:
   - Drag and drop video file.
   - MP4, AVI, MOV.
   - Max 500MB.

2. Uploading:
   - File name.
   - Progress bar.
   - Percentage.

3. Realtime Preview:
   - Processed frames.
   - Effective FPS.
   - Average latency.
   - Frame skip value.

4. Exporting:
   - Current frame / total frames.
   - Estimated time remaining.
   - Output FPS.

5. Completed:
   - Download processed video.
   - Download report.
   - View summary.

6. Error:
   - Unsupported format.
   - GPU unavailable.
   - Video too large.
   - Model failed to load.

## Empty, Loading, and Error States

Add subtle production-ready states:

- AI model warming up.
- Waiting for video upload.
- No violations detected.
- GPU unavailable, using CPU fallback.
- Low confidence detection.
- Camera disconnected.
- Export failed.

Use helpful microcopy, not generic error messages.

## Interaction Requirements

The design should imply:

- Clicking a worker box selects that worker.
- Selected worker row is highlighted in the table.
- Clicking an alert opens the detail drawer.
- Acknowledge changes alert state.
- Filters update table and alerts.
- Export creates processed video and report.
- Upload can start either realtime preview or full export.

## Data Examples

Use realistic values:

- Site: Site A - Construction Zone
- Camera: Camera 03 - Loading Bay
- Model: YOLO11 PPE Detector
- Runtime: RTX 4060 GPU
- FPS: 8.8 to 12.0
- Latency: 83ms to 96ms
- Worker IDs: ID #019, ID #024, ID #031, ID #044
- Confidence: 78% to 96%

## Final Refinement Goal

Make the dashboard feel practical for a future production system with:

- YOLO detection.
- Tracking ID.
- PPE compliance rules.
- Violation alerts.
- Evidence review.
- Video upload and export.
- Operator dashboard statistics.

The UI should remain visually premium, readable, and believable for real safety monitoring operations.
