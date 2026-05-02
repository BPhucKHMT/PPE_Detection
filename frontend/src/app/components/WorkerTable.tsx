import { Filter, Users, ChevronRight } from 'lucide-react';
import { mockWorkers } from '../data';

export function WorkerTable({
  filterMode,
  setFilterMode,
  selectedWorkerId,
  setSelectedWorkerId,
}: {
  filterMode: string;
  setFilterMode: (m: string) => void;
  selectedWorkerId: string | null;
  setSelectedWorkerId: (id: string | null) => void;
}) {
  const filteredWorkers = filterMode === 'all'
    ? mockWorkers
    : mockWorkers.filter(w => w.risk === 'Critical' || w.risk === 'Warning');

  return (
    <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden mb-6">
      <div className="border-b border-slate-700/50 p-4 flex items-center justify-between">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          Worker Tracking & PPE Compliance
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterMode === 'all' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Workers
          </button>
          <button
            onClick={() => setFilterMode('violations')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterMode === 'violations' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Violations Only
          </button>
          <button className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-700/50">
            <tr>
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tracking ID</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Helmet</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Vest</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Gloves</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Mask</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Seen</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Camera</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Risk Level</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkers.map((worker) => {
              const isSelected = selectedWorkerId === worker.id;
              return (
                <tr 
                  key={worker.id} 
                  onClick={() => setSelectedWorkerId(worker.id)}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/80 transition-colors cursor-pointer ${
                    isSelected ? 'bg-slate-800/80' : ''
                  }`}
                >
                  <td className="p-4">
                    <span className={`font-mono font-semibold ${isSelected ? 'text-cyan-400' : 'text-slate-200'}`}>#{worker.id}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      worker.helmet === 'OK' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {worker.helmet}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      worker.vest === 'OK' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {worker.vest}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      worker.gloves === 'OK' ? 'bg-emerald-500/20 text-emerald-400' :
                      worker.gloves === 'Missing' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {worker.gloves}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      worker.mask === 'OK' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {worker.mask}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-400 font-mono">{worker.lastSeen}</td>
                  <td className="p-4 text-sm text-slate-400">{worker.camera}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center w-max ${
                      worker.risk === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      worker.risk === 'Warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {worker.risk}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 font-medium bg-cyan-500/10 px-2 py-1 rounded-lg">
                      View <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
