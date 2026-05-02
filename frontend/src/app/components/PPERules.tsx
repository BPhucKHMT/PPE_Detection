import { Shield } from 'lucide-react';
import { ppeRules } from '../data';

export function PPERules() {
  return (
    <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden mb-6">
      <div className="border-b border-slate-700/50 p-4 flex items-center justify-between">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          PPE Rule Configuration
        </h2>
        <button className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-cyan-500/30">
          Add Rule
        </button>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        {ppeRules.map((rule) => (
          <div key={rule.id} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-semibold text-slate-200">{rule.area}</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rule.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {rule.severity}
                  </span>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${rule.enabled ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {rule.requirements.map(req => (
                <span key={req} className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-700">
                  {req}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
