import { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Save, X, AlertTriangle, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { ppeRules as initialRules } from '../data';
import { toast } from 'sonner';

const ALL_PPE = ['Helmet', 'Vest', 'Gloves', 'Mask', 'Glasses', 'Boots'];
const SEVERITY_OPTS = ['Critical', 'Warning', 'Info'];

type Rule = typeof initialRules[number] & { dirty?: boolean };

export function RulesPage() {
  const [rules, setRules] = useState<Rule[]>(initialRules.map(r => ({ ...r })));
  const [hasChanges, setHasChanges] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newRule, setNewRule] = useState({ area: '', requirements: [] as string[], severity: 'Critical', enabled: true });

  useEffect(() => {
    setHasChanges(rules.some(r => r.dirty));
  }, [rules]);

  function toggleRequirement(ruleId: number, ppe: string) {
    setRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      const has = r.requirements.includes(ppe);
      return {
        ...r,
        requirements: has ? r.requirements.filter(x => x !== ppe) : [...r.requirements, ppe],
        dirty: true,
      };
    }));
  }

  function toggleEnabled(ruleId: number) {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled, dirty: true } : r));
  }

  function setSeverity(ruleId: number, sev: string) {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, severity: sev, dirty: true } : r));
  }

  function deleteRule(ruleId: number) {
    setRules(prev => prev.filter(r => r.id !== ruleId));
    setHasChanges(true);
    toast.info('Rule deleted', { description: 'Save to apply changes.' });
  }

  function saveChanges() {
    setRules(prev => prev.map(r => ({ ...r, dirty: false })));
    setHasChanges(false);
    toast.success('PPE rules saved', { description: 'All rule changes have been applied.' });
  }

  function discardChanges() {
    setRules(initialRules.map(r => ({ ...r })));
    setHasChanges(false);
    setAddingNew(false);
    toast.info('Changes discarded');
  }

  function addRule() {
    if (!newRule.area.trim()) {
      toast.error('Area name is required');
      return;
    }
    if (newRule.requirements.length === 0) {
      toast.error('Select at least one PPE requirement');
      return;
    }
    const id = Math.max(...rules.map(r => r.id)) + 1;
    setRules(prev => [...prev, { ...newRule, id, zone: 'Zone New', cameras: [], dirty: true }]);
    setNewRule({ area: '', requirements: [], severity: 'Critical', enabled: true });
    setAddingNew(false);
    setHasChanges(true);
    toast.success('Rule added', { description: 'Save to apply changes.' });
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">PPE Rules Configuration</h1>
          <p className="text-sm text-slate-400 mt-0.5">Define compliance requirements per zone and severity</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <>
              <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                Unsaved changes
              </div>
              <button onClick={discardChanges} className="px-4 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
                <X className="w-4 h-4" /> Discard
              </button>
              <button onClick={saveChanges} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </>
          )}
          <button
            onClick={() => setAddingNew(v => !v)}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        </div>
      </div>

      {/* Add Rule Form */}
      {addingNew && (
        <div className="bg-slate-800/40 border border-cyan-500/30 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" /> New PPE Rule
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Zone / Area Name</label>
              <input
                value={newRule.area}
                onChange={e => setNewRule(r => ({ ...r, area: e.target.value }))}
                placeholder="e.g. Chemical Storage Area"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Severity</label>
              <div className="flex gap-2">
                {SEVERITY_OPTS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setNewRule(r => ({ ...r, severity: opt }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      newRule.severity === opt
                        ? (opt === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' : opt === 'Warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30')
                        : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:text-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-2 block">Required PPE</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PPE.map(ppe => {
                const active = newRule.requirements.includes(ppe);
                return (
                  <button
                    key={ppe}
                    onClick={() => setNewRule(r => ({
                      ...r,
                      requirements: active ? r.requirements.filter(x => x !== ppe) : [...r.requirements, ppe]
                    }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      active ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:text-slate-200'
                    }`}
                  >
                    {active ? '✓ ' : ''}{ppe}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={addRule} className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors">
              Add Rule
            </button>
            <button onClick={() => setAddingNew(false)} className="px-5 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-2 gap-5">
        {rules.map(rule => (
          <div
            key={rule.id}
            className={`bg-slate-800/30 border rounded-xl p-5 transition-all ${
              rule.dirty ? 'border-amber-500/30 bg-amber-500/5' :
              !rule.enabled ? 'border-slate-700/30 opacity-60' :
              rule.severity === 'Critical' ? 'border-red-500/20 hover:border-red-500/30' :
              'border-amber-500/20 hover:border-amber-500/30'
            }`}
          >
            {/* Rule Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  !rule.enabled ? 'bg-slate-700/50' :
                  rule.severity === 'Critical' ? 'bg-red-500/20' : 'bg-amber-500/20'
                }`}>
                  <ShieldCheck className={`w-5 h-5 ${
                    !rule.enabled ? 'text-slate-500' :
                    rule.severity === 'Critical' ? 'text-red-400' : 'text-amber-400'
                  }`} />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">{rule.area}</div>
                  <div className="text-xs text-slate-500">{rule.zone} · {rule.cameras.length} cameras</div>
                </div>
                {rule.dirty && <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full ml-1">Unsaved</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => toggleEnabled(rule.id)} className="text-slate-400 hover:text-slate-200 transition-colors">
                  {rule.enabled
                    ? <ToggleRight className="w-8 h-8 text-cyan-400" />
                    : <ToggleLeft className="w-8 h-8 text-slate-600" />
                  }
                </button>
              </div>
            </div>

            {/* Severity Selector */}
            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-2 block">Alert Severity</label>
              <div className="flex gap-2">
                {SEVERITY_OPTS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSeverity(rule.id, opt)}
                    disabled={!rule.enabled}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      rule.severity === opt
                        ? (opt === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' : opt === 'Warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30')
                        : 'bg-slate-900/50 text-slate-500 border-slate-700/30 hover:text-slate-300'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Required PPE Chips */}
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Required PPE — click to toggle</label>
              <div className="flex flex-wrap gap-2">
                {ALL_PPE.map(ppe => {
                  const active = rule.requirements.includes(ppe);
                  return (
                    <button
                      key={ppe}
                      onClick={() => toggleRequirement(rule.id, ppe)}
                      disabled={!rule.enabled}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        active
                          ? (rule.severity === 'Critical' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                          : 'bg-slate-900/50 text-slate-500 border-slate-700/30 hover:text-slate-300'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {active ? '✓ ' : ''}{ppe}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save Footer */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900 border border-amber-500/30 rounded-2xl px-6 py-3 shadow-2xl z-40">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span className="text-sm text-slate-300">You have unsaved rule changes</span>
          <button onClick={discardChanges} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors">
            Discard
          </button>
          <button onClick={saveChanges} className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-[0_0_12px_rgba(16,185,129,0.4)]">
            Save All
          </button>
        </div>
      )}
    </div>
  );
}
