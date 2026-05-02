import { useState, useMemo } from 'react';
import { AlertTriangle, Search, Filter, Eye, Check, CheckCheck, Clock, Camera, ShieldAlert, X } from 'lucide-react';
import { mockAlerts as initialAlerts, cameras, type AlertStatus } from '../data';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const SEVERITY_OPTS = ['All', 'Critical', 'Warning'];
const STATUS_OPTS   = ['All', 'New', 'Acknowledged', 'Resolved'];

export function AlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts]       = useState(initialAlerts);
  const [search, setSearch]       = useState('');
  const [severity, setSeverity]   = useState('All');
  const [status, setStatus]       = useState('All');
  const [camFilter, setCamFilter] = useState('All');
  const [selected, setSelected]   = useState<number | null>(null);

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      if (severity !== 'All' && a.severity !== severity) return false;
      if (status   !== 'All' && a.status   !== status)   return false;
      if (camFilter!== 'All' && a.camera   !== camFilter) return false;
      if (search && !`${a.item} ${a.trackingId} ${a.rule}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [alerts, severity, status, camFilter, search]);

  function updateStatus(id: number, newStatus: AlertStatus, e?: React.MouseEvent) {
    e?.stopPropagation();
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    toast.success(`Alert ${newStatus.toLowerCase()}`, { description: `Alert #${id} marked as ${newStatus}.` });
  }

  const counts = {
    New:          alerts.filter(a => a.status === 'New').length,
    Acknowledged: alerts.filter(a => a.status === 'Acknowledged').length,
    Resolved:     alerts.filter(a => a.status === 'Resolved').length,
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Safety Alerts</h1>
          <p className="text-sm text-slate-400 mt-0.5">Centralized alert triage and action management</p>
        </div>
        <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors flex items-center gap-2">
          <Filter className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Summary Badges */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'New',          count: counts.New,          color: 'from-red-500/20 to-red-600/10', border: 'border-red-500/30',     text: 'text-red-400'     },
          { label: 'Acknowledged', count: counts.Acknowledged, color: 'from-amber-500/20 to-amber-600/10',border: 'border-amber-500/30', text: 'text-amber-400'   },
          { label: 'Resolved',     count: counts.Resolved,     color: 'from-emerald-500/20 to-emerald-600/10',border: 'border-emerald-500/30',text: 'text-emerald-400'},
        ].map(b => (
          <div
            key={b.label}
            onClick={() => setStatus(prev => prev === b.label ? 'All' : b.label)}
            className={`bg-gradient-to-br ${b.color} border ${b.border} rounded-xl p-4 cursor-pointer hover:brightness-110 transition-all ${status === b.label ? 'ring-1 ring-offset-1 ring-offset-slate-900' : ''}`}
            style={{ ringColor: 'currentColor' }}
          >
            <div className={`text-3xl font-bold ${b.text}`}>{b.count}</div>
            <div className="text-sm text-slate-400 mt-0.5">{b.label} Alerts</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search alerts…"
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <FilterGroup label="Severity" options={SEVERITY_OPTS} value={severity} onChange={setSeverity} />
        <FilterGroup label="Status"   options={STATUS_OPTS}   value={status}   onChange={setStatus}   />

        <select
          value={camFilter}
          onChange={e => setCamFilter(e.target.value)}
          className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer"
        >
          <option value="All">All Cameras</option>
          {cameras.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
        </select>

        {(severity !== 'All' || status !== 'All' || camFilter !== 'All' || search) && (
          <button
            onClick={() => { setSeverity('All'); setStatus('All'); setCamFilter('All'); setSearch(''); }}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-slate-500">{filtered.length} of {alerts.length} alerts</span>
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/20 border border-slate-700/40 rounded-xl">
            <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No alerts match your filters</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filter criteria</p>
            <button onClick={() => { setSeverity('All'); setStatus('All'); setCamFilter('All'); setSearch(''); }} className="mt-4 text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
              Clear all filters
            </button>
          </div>
        ) : filtered.map(alert => {
          const isCritical = alert.severity === 'Critical';
          const isSelected = selected === alert.id;

          return (
            <div
              key={alert.id}
              onClick={() => setSelected(prev => prev === alert.id ? null : alert.id)}
              className={`bg-slate-800/30 border rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden ${
                isSelected
                  ? (isCritical ? 'border-red-500/60 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-amber-500/60 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]')
                  : (isCritical ? 'border-red-500/20 hover:border-red-500/40' : 'border-amber-500/20 hover:border-amber-500/40')
              }`}
            >
              {/* Severity strip */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`} />

              <div className="pl-3 flex items-center gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  isCritical ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'
                }`}>
                  <ShieldAlert className={`w-6 h-6 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isCritical ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                      {alert.severity}
                    </span>
                    <span className="font-semibold text-sm text-slate-100">{alert.item}</span>
                    <span className="text-xs text-slate-400 truncate">{alert.rule}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{alert.time}</span>
                    <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{alert.camera}</span>
                    <span className="font-mono text-cyan-400 font-semibold">ID #{alert.trackingId}</span>
                    <span>Conf: <span className="text-slate-300 font-mono">{alert.confidence}%</span></span>
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                    alert.status === 'New'          ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                    alert.status === 'Acknowledged' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {alert.status}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); navigate('/monitor'); }}
                      className="px-3 py-1.5 bg-slate-700/60 hover:bg-slate-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {alert.status === 'New' && (
                      <button
                        onClick={e => updateStatus(alert.id, 'Acknowledged', e)}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" /> Ack
                      </button>
                    )}
                    {alert.status === 'Acknowledged' && (
                      <button
                        onClick={e => updateStatus(alert.id, 'Resolved', e)}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterGroup({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1 border border-slate-700/40">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            value === opt ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
