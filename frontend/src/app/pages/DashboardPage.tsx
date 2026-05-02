import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Users, Check, AlertTriangle, Shield, TrendingUp, Zap } from 'lucide-react';
import { VideoMonitor } from '../components/VideoMonitor';
import { LiveAlerts } from '../components/LiveAlerts';
import { AnalyticsWidgets } from '../components/AnalyticsWidgets';
import { WorkerTable } from '../components/WorkerTable';
import { WorkerDetailDrawer } from '../components/WorkerDetailDrawer';

const kpis = [
  { label: 'Workers Detected',   value: '18',    icon: Users,         color: 'from-blue-500 to-cyan-500',     sub: '+2 vs last hour',  subOk: true  },
  { label: 'Compliant Workers',  value: '14',    icon: Check,         color: 'from-emerald-500 to-green-500', sub: '78% compliance',   subOk: true  },
  { label: 'Active Violations',  value: '4',     icon: AlertTriangle, color: 'from-amber-500 to-orange-500',  sub: '↑ 1 since 19:20',  subOk: false },
  { label: 'Critical Alerts',    value: '12',    icon: Shield,        color: 'from-red-500 to-rose-500',      sub: 'Today total',      subOk: false },
  { label: 'Avg Confidence',     value: '91.8%', icon: TrendingUp,    color: 'from-purple-500 to-indigo-500', sub: 'YOLO11 PT model',  subOk: true  },
  { label: 'Processing FPS',     value: '11.6',  icon: Zap,           color: 'from-cyan-500 to-blue-500',     sub: 'RTX 4060 GPU',     subOk: true  },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [filterMode, setFilterMode] = useState('all');
  const [overlays, setOverlays] = useState({ boxes: true, labels: true, confidence: true, path: false });

  return (
    <div className="p-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/60 transition-all cursor-default group"
          >
            <div className={`w-10 h-10 bg-gradient-to-br ${kpi.color} rounded-lg flex items-center justify-center mb-3 shadow-lg group-hover:scale-105 transition-transform`}>
              <kpi.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-bold mb-0.5 text-slate-100">{kpi.value}</div>
            <div className="text-xs text-slate-400 mb-1">{kpi.label}</div>
            <div className={`text-[10px] font-medium ${kpi.subOk ? 'text-emerald-400' : 'text-amber-400'}`}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Row: Video Monitor + Alerts */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <VideoMonitor
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          selectedWorkerId={selectedWorkerId}
          setSelectedWorkerId={setSelectedWorkerId}
          overlays={overlays}
          setOverlays={setOverlays}
        />
        <LiveAlerts
          selectedAlertId={selectedAlertId}
          setSelectedAlertId={setSelectedAlertId}
          setSelectedWorkerId={setSelectedWorkerId}
          onViewAll={() => navigate('/alerts')}
        />
      </div>

      {/* Analytics */}
      <AnalyticsWidgets />

      {/* Worker Table */}
      <WorkerTable
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        selectedWorkerId={selectedWorkerId}
        setSelectedWorkerId={setSelectedWorkerId}
      />

      {/* Worker Detail Drawer */}
      <WorkerDetailDrawer
        selectedWorkerId={selectedWorkerId}
        setSelectedWorkerId={setSelectedWorkerId}
        selectedAlertId={selectedAlertId}
        setSelectedAlertId={setSelectedAlertId}
      />
    </div>
  );
}
