// ─── Workers ────────────────────────────────────────────────────────────────
export const mockWorkers = [
  { id: '024', name: 'Carlos Reyes',    department: 'Logistics',    shift: 'Day',   zone: 'Loading Bay',
    helmet: 'Missing', vest: 'OK',      gloves: 'OK',      mask: 'N/A', boots: 'OK', glasses: 'N/A',
    camera: 'Camera 03', lastSeen: '19:24:08', firstSeen: '19:20:12',
    risk: 'Critical', confidence: 92, x: 320, y: 180, violationDuration: '03m 56s',
    complianceScore: 64, complianceHistory: [95, 98, 92, 88, 72, 65, 64] },
  { id: '031', name: 'Mei Lin',         department: 'Operations',   shift: 'Day',   zone: 'Loading Bay',
    helmet: 'OK',      vest: 'OK',      gloves: 'OK',      mask: 'OK',  boots: 'OK', glasses: 'N/A',
    camera: 'Camera 01', lastSeen: '19:24:09', firstSeen: '07:08:34',
    risk: 'Safe', confidence: 95, x: 580, y: 220, violationDuration: '—',
    complianceScore: 98, complianceHistory: [96, 98, 99, 97, 98, 98, 98] },
  { id: '044', name: 'Dev Patel',        department: 'Maintenance',  shift: 'Day',   zone: 'Welding Area',
    helmet: 'OK',      vest: 'OK',      gloves: 'Missing', mask: 'N/A', boots: 'OK', glasses: 'OK',
    camera: 'Camera 01', lastSeen: '19:23:51', firstSeen: '08:00:00',
    risk: 'Warning', confidence: 78, x: 180, y: 280, violationDuration: '01m 22s',
    complianceScore: 82, complianceHistory: [97, 95, 90, 88, 82, 80, 82] },
  { id: '019', name: 'Sofia Morales',   department: 'Logistics',    shift: 'Day',   zone: 'Loading Bay',
    helmet: 'OK',      vest: 'Missing', gloves: 'OK',      mask: 'N/A', boots: 'OK', glasses: 'N/A',
    camera: 'Camera 02', lastSeen: '19:22:44', firstSeen: '07:45:11',
    risk: 'Critical', confidence: 89, x: 720, y: 200, violationDuration: '02m 04s',
    complianceScore: 71, complianceHistory: [88, 90, 85, 80, 75, 72, 71] },
  { id: '052', name: 'James Park',      department: 'Operations',   shift: 'Night', zone: 'Medical Zone',
    helmet: 'OK',      vest: 'OK',      gloves: 'OK',      mask: 'OK',  boots: 'OK', glasses: 'N/A',
    camera: 'Camera 03', lastSeen: '19:24:10', firstSeen: '19:00:05',
    risk: 'Safe', confidence: 94, x: 480, y: 320, violationDuration: '—',
    complianceScore: 96, complianceHistory: [92, 94, 95, 96, 96, 96, 96] },
  { id: '067', name: 'Aisha Nkosi',     department: 'Safety',       shift: 'Day',   zone: 'Visitor Area',
    helmet: 'OK',      vest: 'OK',      gloves: 'N/A',     mask: 'N/A', boots: 'OK', glasses: 'N/A',
    camera: 'Camera 04', lastSeen: '19:24:00', firstSeen: '08:30:00',
    risk: 'Safe', confidence: 97, x: 250, y: 150, violationDuration: '—',
    complianceScore: 99, complianceHistory: [99, 99, 98, 99, 99, 99, 99] },
  { id: '081', name: 'Tom Brennan',     department: 'Engineering',  shift: 'Day',   zone: 'Welding Area',
    helmet: 'OK',      vest: 'OK',      gloves: 'OK',      mask: 'N/A', boots: 'OK', glasses: 'Missing',
    camera: 'Camera 02', lastSeen: '19:23:00', firstSeen: '09:15:00',
    risk: 'Warning', confidence: 81, x: 400, y: 260, violationDuration: '00m 48s',
    complianceScore: 87, complianceHistory: [94, 92, 89, 87, 87, 87, 87] },
  { id: '093', name: 'Lin Wei',         department: 'Quality',      shift: 'Night', zone: 'Loading Bay',
    helmet: 'OK',      vest: 'OK',      gloves: 'OK',      mask: 'OK',  boots: 'OK', glasses: 'OK',
    camera: 'Camera 01', lastSeen: '19:24:12', firstSeen: '19:05:22',
    risk: 'Safe', confidence: 96, x: 620, y: 300, violationDuration: '—',
    complianceScore: 100, complianceHistory: [100, 100, 100, 100, 100, 100, 100] },
];

// ─── Cameras ────────────────────────────────────────────────────────────────
export const cameras = [
  { id: 'cam01', label: 'Camera 01', location: 'Main Entrance', resolution: '1920x1080', fps: 11.6, latency: 85, status: 'online', workers: 3 },
  { id: 'cam02', label: 'Camera 02', location: 'Loading Bay North', resolution: '1280x720', fps: 10.2, latency: 93, status: 'online', workers: 2 },
  { id: 'cam03', label: 'Camera 03', location: 'Loading Bay South', resolution: '1280x720', fps: 11.6, latency: 85, status: 'online', workers: 3 },
  { id: 'cam04', label: 'Camera 04', location: 'Welding Area', resolution: '1920x1080', fps: 9.8, latency: 97, status: 'online', workers: 2 },
  { id: 'cam05', label: 'Camera 05', location: 'Medical Zone', resolution: '1280x720', fps: 8.8, latency: 101, status: 'warning', workers: 1 },
  { id: 'cam06', label: 'Camera 06', location: 'Visitor Area', resolution: '1280x720', fps: 0, latency: 0, status: 'offline', workers: 0 },
];

// ─── Alerts ─────────────────────────────────────────────────────────────────
export type AlertStatus = 'New' | 'Acknowledged' | 'Resolved';
export const mockAlerts = [
  { id: 1,  severity: 'Critical', trackingId: '024', item: 'Helmet Missing',        rule: 'Loading Bay Helmet Rule',   camera: 'Camera 03', time: '19:24:08', confidence: 92, status: 'New'          as AlertStatus },
  { id: 2,  severity: 'Warning',  trackingId: '044', item: 'Gloves Missing',         rule: 'Welding Area Gloves Rule',  camera: 'Camera 01', time: '19:23:51', confidence: 78, status: 'Acknowledged' as AlertStatus },
  { id: 3,  severity: 'Critical', trackingId: '019', item: 'Safety Vest Missing',    rule: 'Loading Bay Vest Rule',     camera: 'Camera 02', time: '19:22:44', confidence: 89, status: 'New'          as AlertStatus },
  { id: 4,  severity: 'Warning',  trackingId: '081', item: 'Safety Glasses Missing', rule: 'Welding Area Glasses Rule', camera: 'Camera 02', time: '19:21:30', confidence: 81, status: 'New'          as AlertStatus },
  { id: 5,  severity: 'Critical', trackingId: '024', item: 'Helmet Missing',         rule: 'Loading Bay Helmet Rule',   camera: 'Camera 03', time: '19:18:00', confidence: 90, status: 'Resolved'     as AlertStatus },
  { id: 6,  severity: 'Warning',  trackingId: '031', item: 'Low Confidence',         rule: 'Global Detection Rule',     camera: 'Camera 01', time: '19:20:12', confidence: 68, status: 'Acknowledged' as AlertStatus },
  { id: 7,  severity: 'Critical', trackingId: '019', item: 'Safety Vest Missing',    rule: 'Loading Bay Vest Rule',     camera: 'Camera 02', time: '19:10:55', confidence: 87, status: 'Resolved'     as AlertStatus },
  { id: 8,  severity: 'Warning',  trackingId: '093', item: 'Low Confidence',         rule: 'Global Detection Rule',     camera: 'Camera 01', time: '19:05:30', confidence: 71, status: 'Resolved'     as AlertStatus },
];

// ─── Analytics ─────────────────────────────────────────────────────────────
export const complianceData = [
  { name: 'Compliant', value: 78, color: '#10b981' },
  { name: 'Warning',   value: 11, color: '#f59e0b' },
  { name: 'Critical',  value: 11, color: '#ef4444' },
];

export const alertsTimeData = [
  { time: '18:00', critical: 0, warning: 1 },
  { time: '18:15', critical: 1, warning: 2 },
  { time: '18:30', critical: 0, warning: 1 },
  { time: '18:45', critical: 2, warning: 4 },
  { time: '19:00', critical: 3, warning: 5 },
  { time: '19:15', critical: 1, warning: 2 },
  { time: '19:20', critical: 2, warning: 3 },
  { time: '19:24', critical: 2, warning: 2 },
];

export const violationTypesData = [
  { name: 'Helmet',  count: 18 },
  { name: 'Vest',    count: 12 },
  { name: 'Gloves',  count: 8  },
  { name: 'Glasses', count: 6  },
  { name: 'Mask',    count: 4  },
  { name: 'Boots',   count: 2  },
];

export const performanceData = [
  { time: '19:20', fps: 11.2, latency: 90, confidence: 92 },
  { time: '19:21', fps: 11.5, latency: 88, confidence: 93 },
  { time: '19:22', fps: 10.8, latency: 95, confidence: 91 },
  { time: '19:23', fps: 9.8,  latency: 96, confidence: 89 },
  { time: '19:24', fps: 11.6, latency: 85, confidence: 94 },
];

// ─── PPE Rules ───────────────────────────────────────────────────────────────
export const ppeRules = [
  { id: 1, area: 'Loading Bay',  requirements: ['Helmet', 'Vest'],                     severity: 'Critical', enabled: true,  cameras: ['Camera 02', 'Camera 03'], zone: 'Zone A' },
  { id: 2, area: 'Welding Area', requirements: ['Helmet', 'Gloves', 'Glasses'],        severity: 'Critical', enabled: true,  cameras: ['Camera 04'],              zone: 'Zone B' },
  { id: 3, area: 'Medical Zone', requirements: ['Mask', 'Gloves'],                     severity: 'Warning',  enabled: true,  cameras: ['Camera 05'],              zone: 'Zone C' },
  { id: 4, area: 'Visitor Area', requirements: ['Helmet'],                             severity: 'Warning',  enabled: false, cameras: ['Camera 06'],              zone: 'Zone D' },
];

// ─── Reports / Historical ───────────────────────────────────────────────────
export const weeklyComplianceData = [
  { day: 'Mon', compliant: 82, warning: 12, critical: 6 },
  { day: 'Tue', compliant: 79, warning: 14, critical: 7 },
  { day: 'Wed', compliant: 85, warning: 10, critical: 5 },
  { day: 'Thu', compliant: 76, warning: 15, critical: 9 },
  { day: 'Fri', compliant: 78, warning: 11, critical: 11 },
  { day: 'Sat', compliant: 90, warning: 7,  critical: 3 },
  { day: 'Sun', compliant: 88, warning: 8,  critical: 4 },
];

export const weeklyViolationsData = [
  { day: 'Mon', violations: 14 },
  { day: 'Tue', violations: 18 },
  { day: 'Wed', violations: 11 },
  { day: 'Thu', violations: 22 },
  { day: 'Fri', violations: 19 },
  { day: 'Sat', violations: 8  },
  { day: 'Sun', violations: 10 },
];

export const responseTimeData = [
  { time: '08:00', avg: 4.2 },
  { time: '10:00', avg: 3.8 },
  { time: '12:00', avg: 5.1 },
  { time: '14:00', avg: 3.2 },
  { time: '16:00', avg: 4.8 },
  { time: '18:00', avg: 6.3 },
  { time: '19:24', avg: 2.9 },
];

export const sites = [
  'Site A - Construction Zone',
  'Site B - Manufacturing',
  'Site C - Warehouse',
];
