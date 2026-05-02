import { X, Camera, Download, FileText, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import { mockWorkers, mockAlerts } from '../data';

export function WorkerDetailDrawer({
  selectedWorkerId,
  setSelectedWorkerId,
  selectedAlertId,
  setSelectedAlertId,
}: {
  selectedWorkerId: string | null;
  setSelectedWorkerId: (id: string | null) => void;
  selectedAlertId: number | null;
  setSelectedAlertId: (id: number | null) => void;
}) {
  if (!selectedWorkerId) return null;

  const worker = mockWorkers.find(w => w.id === selectedWorkerId);
  const alert = selectedAlertId ? mockAlerts.find(a => a.id === selectedAlertId) : mockAlerts.find(a => a.trackingId === selectedWorkerId);

  if (!worker) return null;

  const isCritical = worker.risk === 'Critical';
  const isWarning = worker.risk === 'Warning';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-end z-50 transition-opacity" onClick={() => {
      setSelectedWorkerId(null);
      setSelectedAlertId(null);
    }}>
      <div
        className="w-96 h-full bg-slate-900 border-l border-slate-700/50 flex flex-col shadow-2xl transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-slate-900/50">
          <h2 className="text-lg font-semibold flex items-center gap-3">
            <span className="text-cyan-400 font-mono text-xl">#{worker.id}</span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
              isCritical ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              isWarning ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {worker.risk}
            </span>
          </h2>
          <button onClick={() => {
            setSelectedWorkerId(null);
            setSelectedAlertId(null);
          }} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Evidence Frame */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-300">Evidence Snapshot</span>
              <span className="text-slate-400 font-mono text-xs">{worker.lastSeen}</span>
            </div>
            <div className="aspect-video bg-slate-950 rounded-xl flex items-center justify-center border border-slate-700/50 relative overflow-hidden group">
              {/* Fake image structure */}
              <div className="absolute inset-0 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] mix-blend-overlay" />
              <Camera className="w-12 h-12 text-slate-700 absolute z-0" />
              <div className={`absolute z-10 w-16 h-24 border-2 rounded-md ${isCritical ? 'border-red-500' : isWarning ? 'border-amber-500' : 'border-emerald-500'} bg-black/10 flex items-end justify-center pb-2`}>
                <div className={`w-1 h-1 rounded-full animate-ping ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </div>
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm text-[10px] text-cyan-400 font-mono font-bold rounded shadow-lg border border-slate-700/50">
                {worker.camera}
              </div>
            </div>
            {alert && (
              <div className={`p-3 rounded-lg border text-sm flex gap-3 ${isCritical ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                <ShieldAlert className={`w-5 h-5 flex-shrink-0 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
                <div>
                  <div className="font-semibold text-slate-200 mb-0.5">{alert.item}</div>
                  <div className="text-slate-400 text-xs">{alert.rule}</div>
                </div>
              </div>
            )}
          </div>

          {/* PPE Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Detected PPE Status</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Helmet', val: worker.helmet },
                { label: 'Vest', val: worker.vest },
                { label: 'Gloves', val: worker.gloves },
                { label: 'Mask', val: worker.mask },
              ].map(item => (
                <div key={item.label} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    item.val === 'OK' ? 'bg-emerald-500/20 text-emerald-400' :
                    item.val === 'Missing' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {item.val}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <span className="text-sm text-slate-400">AI Confidence Score</span>
              <span className="font-mono text-emerald-400 font-bold">{worker.confidence}%</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Tracking Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">First Seen</span>
                <span className="text-slate-200 font-mono">19:20:12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Seen</span>
                <span className="text-slate-200 font-mono">{worker.lastSeen}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Violation Duration</span>
                <span className="text-amber-400 font-mono">03m 56s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Camera Source</span>
                <span className="text-cyan-400 underline decoration-cyan-400/30 underline-offset-4 cursor-pointer">{worker.camera}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800/80 bg-slate-900/50 space-y-3">
          {alert && alert.status === 'New' && (
            <button className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium">
              <CheckCircle className="w-5 h-5" /> Mark Resolved
            </button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm">
              <FileText className="w-4 h-4" /> Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
