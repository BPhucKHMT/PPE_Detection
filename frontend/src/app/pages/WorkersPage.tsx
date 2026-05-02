import { useState, useMemo } from 'react';
import {
  Search, Users, LayoutGrid, List, Filter,
  Shield, Camera, Clock, ChevronRight, X, TrendingUp
} from 'lucide-react';
import { mockWorkers } from '../data';
import { WorkerDetailDrawer } from '../components/WorkerDetailDrawer';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';

const RISK_OPTS = ['All', 'Critical', 'Warning', 'Safe'];
const SHIFT_OPTS = ['All', 'Day', 'Night'];

function ComplianceMini({ data }: { data: number[] }) {
  const points = data.map((v, i) => ({ i, v }));
  const last = data[data.length - 1];
  const color = last >= 90 ? '#10b981' : last >= 75 ? '#f59e0b' : '#ef4444';
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
        <Tooltip contentStyle={{ display: 'none' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const cls = risk === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/30'
            : risk === 'Warning'  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{risk}</span>
  );
}

function PPEBadge({ val }: { val: string }) {
  if (val === 'N/A') return <span className="text-slate-500 text-xs">—</span>;
  const cls = val === 'OK' ? 'text-emerald-400' : 'text-red-400';
  return <span className={`text-xs font-medium ${cls}`}>{val === 'OK' ? '✓' : '✗'} {val}</span>;
}

export function WorkersPage() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [shiftFilter, setShiftFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return mockWorkers.filter(w => {
      if (riskFilter  !== 'All' && w.risk  !== riskFilter)  return false;
      if (shiftFilter !== 'All' && w.shift !== shiftFilter) return false;
      if (search && !`${w.id} ${w.name} ${w.zone} ${w.department}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, riskFilter, shiftFilter]);

  const stats = {
    total:    mockWorkers.length,
    safe:     mockWorkers.filter(w => w.risk === 'Safe').length,
    warning:  mockWorkers.filter(w => w.risk === 'Warning').length,
    critical: mockWorkers.filter(w => w.risk === 'Critical').length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Worker Tracking</h1>
          <p className="text-sm text-slate-400 mt-0.5">Real-time PPE compliance per individual worker</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg border transition-colors ${viewMode === 'grid' ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg border transition-colors ${viewMode === 'list' ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Detected',   val: stats.total,    color: 'text-slate-100',    icon: Users,     bg: 'from-blue-500/20 to-blue-600/10',     border: 'border-blue-500/20'     },
          { label: 'Compliant',        val: stats.safe,     color: 'text-emerald-400',  icon: Shield,    bg: 'from-emerald-500/20 to-emerald-600/10',border: 'border-emerald-500/20' },
          { label: 'Warning',          val: stats.warning,  color: 'text-amber-400',    icon: Filter,    bg: 'from-amber-500/20 to-amber-600/10',    border: 'border-amber-500/20'   },
          { label: 'Critical',         val: stats.critical, color: 'text-red-400',      icon: X,         bg: 'from-red-500/20 to-red-600/10',        border: 'border-red-500/20'     },
        ].map(k => (
          <div key={k.label} className={`bg-gradient-to-br ${k.bg} border ${k.border} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{k.label}</span>
              <k.icon className="w-4 h-4 text-slate-500" />
            </div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, name, zone…"
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><X className="w-3.5 h-3.5" /></button>}
        </div>

        <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/40">
          {RISK_OPTS.map(opt => (
            <button key={opt} onClick={() => setRiskFilter(opt)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${riskFilter === opt ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>
              {opt}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/40">
          {SHIFT_OPTS.map(opt => (
            <button key={opt} onClick={() => setShiftFilter(opt)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${shiftFilter === opt ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>
              {opt}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-slate-500">{filtered.length} workers</span>
      </div>

      {/* Worker Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-4 gap-4">
          {filtered.map(worker => (
            <div
              key={worker.id}
              onClick={() => setSelectedWorkerId(worker.id)}
              className={`bg-slate-800/30 border rounded-xl p-4 cursor-pointer hover:border-slate-600 transition-all hover:shadow-lg group ${
                worker.risk === 'Critical' ? 'border-red-500/30 hover:border-red-500/50' :
                worker.risk === 'Warning'  ? 'border-amber-500/30 hover:border-amber-500/50' :
                'border-slate-700/50'
              }`}
            >
              {/* Avatar + ID */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                    worker.risk === 'Critical' ? 'bg-red-500/20 text-red-400' :
                    worker.risk === 'Warning'  ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {worker.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-100 truncate max-w-24">{worker.name}</div>
                    <div className="text-xs text-cyan-400 font-mono">#{worker.id}</div>
                  </div>
                </div>
                <RiskBadge risk={worker.risk} />
              </div>

              {/* Details */}
              <div className="space-y-1.5 mb-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5"><Users className="w-3 h-3" />{worker.department}</div>
                <div className="flex items-center gap-1.5"><Camera className="w-3 h-3" />{worker.camera}</div>
                <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{worker.lastSeen}</div>
              </div>

              {/* PPE Quick Status */}
              <div className="grid grid-cols-2 gap-1 mb-3">
                {[
                  { label: 'Helmet', val: worker.helmet },
                  { label: 'Vest',   val: worker.vest   },
                  { label: 'Gloves', val: worker.gloves },
                  { label: 'Mask',   val: worker.mask   },
                ].map(item => (
                  <div key={item.label} className="bg-slate-900/50 rounded-lg px-2 py-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{item.label}</span>
                    <PPEBadge val={item.val} />
                  </div>
                ))}
              </div>

              {/* Compliance Sparkline */}
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" />7-day trend</span>
                  <span className={`font-mono font-bold ${worker.complianceScore >= 90 ? 'text-emerald-400' : worker.complianceScore >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
                    {worker.complianceScore}%
                  </span>
                </div>
                <ComplianceMini data={worker.complianceHistory} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700/50">
              <tr>
                {['Worker', 'Helmet', 'Vest', 'Gloves', 'Zone', 'Camera', 'Last Seen', 'Compliance', 'Risk', ''].map(h => (
                  <th key={h} className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(worker => (
                <tr
                  key={worker.id}
                  onClick={() => setSelectedWorkerId(worker.id)}
                  className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        worker.risk === 'Critical' ? 'bg-red-500/20 text-red-400' :
                        worker.risk === 'Warning'  ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>{worker.name.split(' ').map(n => n[0]).join('')}</div>
                      <div>
                        <div className="text-sm font-medium text-slate-200">{worker.name}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">#{worker.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3"><PPEBadge val={worker.helmet} /></td>
                  <td className="p-3"><PPEBadge val={worker.vest} /></td>
                  <td className="p-3"><PPEBadge val={worker.gloves} /></td>
                  <td className="p-3 text-xs text-slate-400">{worker.zone}</td>
                  <td className="p-3 text-xs text-slate-400">{worker.camera}</td>
                  <td className="p-3 text-xs text-slate-400 font-mono">{worker.lastSeen}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          worker.complianceScore >= 90 ? 'bg-emerald-500' :
                          worker.complianceScore >= 75 ? 'bg-amber-500' : 'bg-red-500'
                        }`} style={{ width: `${worker.complianceScore}%` }} />
                      </div>
                      <span className="text-xs font-mono text-slate-300">{worker.complianceScore}%</span>
                    </div>
                  </td>
                  <td className="p-3"><RiskBadge risk={worker.risk} /></td>
                  <td className="p-3">
                    <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-slate-800/20 border border-slate-700/40 rounded-xl">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No workers match your filters</p>
          <button onClick={() => { setSearch(''); setRiskFilter('All'); setShiftFilter('All'); }} className="mt-3 text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
            Clear filters
          </button>
        </div>
      )}

      <WorkerDetailDrawer
        selectedWorkerId={selectedWorkerId}
        setSelectedWorkerId={setSelectedWorkerId}
        selectedAlertId={null}
        setSelectedAlertId={() => {}}
      />
    </div>
  );
}
