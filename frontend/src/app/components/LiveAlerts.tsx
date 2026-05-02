import { useState } from 'react';
import { AlertTriangle, Clock, Eye, ShieldAlert, ChevronRight } from 'lucide-react';
import { mockAlerts, type AlertStatus } from '../data';
import { toast } from 'sonner';

export function LiveAlerts({
  selectedAlertId,
  setSelectedAlertId,
  setSelectedWorkerId,
  onViewAll,
}: {
  selectedAlertId: number | null;
  setSelectedAlertId: (id: number | null) => void;
  setSelectedWorkerId: (id: string | null) => void;
  onViewAll?: () => void;
}) {
  const [alerts, setAlerts] = useState(mockAlerts);

  function acknowledge(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setAlerts(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'Acknowledged' as AlertStatus } : a)
    );
    toast.success('Alert acknowledged', { description: `Alert #${id} marked as acknowledged.` });
  }

  return (
    <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden flex flex-col h-[520px]">
      <div className="border-b border-slate-700/50 p-4 bg-slate-900/30 flex items-center justify-between">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Live Safety Alerts
          <span className="ml-1 px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold">
            {alerts.filter(a => a.status === 'New').length} New
          </span>
        </h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'Critical';
          const isSelected = selectedAlertId === alert.id;

          return (
            <div
              key={alert.id}
              onClick={() => {
                setSelectedAlertId(alert.id);
                setSelectedWorkerId(alert.trackingId);
              }}
              className={`border rounded-xl p-3 cursor-pointer transition-all relative overflow-hidden ${
                isSelected
                  ? (isCritical
                      ? 'bg-red-500/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      : 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]')
                  : (isCritical
                      ? 'bg-slate-800/50 border-red-500/30 hover:border-red-500/50'
                      : 'bg-slate-800/50 border-amber-500/30 hover:border-amber-500/50')
              }`}
            >
              {/* Severity strip */}
              <div className={`absolute top-0 left-0 bottom-0 w-1 ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`} />

              <div className="pl-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isCritical ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                      {alert.severity}
                    </span>
                    <span className="text-slate-400 text-xs font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {alert.time}
                    </span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                    alert.status === 'New'          ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                    alert.status === 'Acknowledged' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {alert.status}
                  </span>
                </div>

                <div className="flex gap-3 mb-2">
                  <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700/50 flex-shrink-0">
                    <ShieldAlert className={`w-7 h-7 ${isCritical ? 'text-red-500/60' : 'text-amber-500/60'}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-100">{alert.item}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{alert.rule}</div>
                    <div className="font-mono text-xs text-cyan-400 mt-1 font-bold">ID #{alert.trackingId}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/30">
                  <span className="text-xs text-slate-400">Conf: <span className="text-slate-300 font-mono">{alert.confidence}%</span></span>
                  <div className="flex gap-1.5">
                    <button className="px-2.5 py-1 bg-slate-700/50 hover:bg-slate-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                      <Eye className="w-3 h-3" /> View
                    </button>
                    {alert.status === 'New' && (
                      <button
                        onClick={(e) => acknowledge(alert.id, e)}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors"
                      >
                        Ack
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
