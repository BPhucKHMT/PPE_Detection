import { useState } from 'react';
import { User, Bell, Cpu, Link2, Save, X, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { sites } from '../data';

const TABS = [
  { id: 'profile',      icon: User,  label: 'Profile'        },
  { id: 'notifications',icon: Bell,  label: 'Notifications'  },
  { id: 'model',        icon: Cpu,   label: 'Site & Model'   },
  { id: 'integrations', icon: Link2, label: 'Integrations'   },
];

function SettingsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-200">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-800/60 last:border-0">
      <div>
        <div className="text-sm text-slate-200">{label}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full p-0.5 transition-colors ${checked ? 'bg-cyan-500' : 'bg-slate-700'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function InputRow({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="mb-4">
      <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
      />
    </div>
  );
}

export function SettingsPage() {
  const { activeSite, setActiveSite, isAIActive, setIsAIActive } = useAppContext();
  const [activeTab, setActiveTab] = useState('profile');
  const [dirty, setDirty] = useState(false);

  // Profile
  const [profile, setProfile] = useState({ name: 'Safety Manager', email: 'manager@site-a.com', role: 'Site Supervisor', phone: '+1 555 0123' });
  const profileSet = (k: keyof typeof profile, v: string) => { setProfile(p => ({ ...p, [k]: v })); setDirty(true); };

  // Notifications
  const [notifs, setNotifs] = useState({ emailCritical: true, emailWarning: false, pushAll: true, webhookEnabled: false, slackEnabled: false, criticalOnly: true });
  const notifsSet = (k: keyof typeof notifs, v: boolean) => { setNotifs(n => ({ ...n, [k]: v })); setDirty(true); };

  // Model
  const [modelSettings, setModelSettings] = useState({ site: activeSite, model: 'YOLO11 PPE Detector', confidence: '75', fpsCap: '15', resolution: '1280x720' });
  const modelSet = (k: keyof typeof modelSettings, v: string) => { setModelSettings(m => ({ ...m, [k]: v })); setDirty(true); };

  // Integrations
  const [integrations, setIntegrations] = useState({ webhookUrl: '', apiKey: 'ppv_live_••••••••••••••••', slackWebhook: '' });
  const intSet = (k: keyof typeof integrations, v: string) => { setIntegrations(i => ({ ...i, [k]: v })); setDirty(true); };

  function save() {
    if (modelSettings.site !== activeSite) setActiveSite(modelSettings.site);
    setDirty(false);
    toast.success('Settings saved', { description: 'Your preferences have been updated.' });
  }

  function discard() {
    setDirty(false);
    toast.info('Changes discarded');
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">System configuration, preferences, and integrations</p>
        </div>
        {dirty && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-4 h-4" /> Unsaved changes
            </div>
            <button onClick={discard} className="px-4 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
              <X className="w-4 h-4" /> Discard
            </button>
            <button onClick={save} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Tab List */}
        <div className="w-52 shrink-0">
          <nav className="space-y-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all border ${
                  activeTab === t.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border-transparent'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-slate-800/20 border border-slate-700/50 rounded-xl p-6">

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <div className="flex items-center gap-5 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                  SM
                </div>
                <div>
                  <div className="font-semibold text-slate-200 text-lg">{profile.name}</div>
                  <div className="text-sm text-slate-400">{profile.role}</div>
                  <button className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">Change avatar</button>
                </div>
              </div>
              <SettingsSection title="Personal Information">
                <div className="grid grid-cols-2 gap-4">
                  <InputRow label="Full Name"   value={profile.name}  onChange={v => profileSet('name', v)}  placeholder="Your full name" />
                  <InputRow label="Role / Title" value={profile.role}  onChange={v => profileSet('role', v)}  placeholder="e.g. Site Supervisor" />
                  <InputRow label="Email"        value={profile.email} onChange={v => profileSet('email', v)} placeholder="you@company.com" type="email" />
                  <InputRow label="Phone"        value={profile.phone} onChange={v => profileSet('phone', v)} placeholder="+1 555 0000" />
                </div>
              </SettingsSection>
              <SettingsSection title="Security" description="Manage your password and session settings.">
                <button className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600/50 rounded-lg text-sm font-medium transition-colors">
                  Change Password
                </button>
              </SettingsSection>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <SettingsSection title="Email Alerts" description="Receive safety alerts via email.">
                <div className="bg-slate-900/40 rounded-xl border border-slate-700/50 px-4 divide-y divide-slate-800/60">
                  <ToggleRow label="Critical violations"    sub="Immediate email on critical PPE violations"        checked={notifs.emailCritical}  onChange={v => notifsSet('emailCritical', v)} />
                  <ToggleRow label="Warning violations"     sub="Email digest for warning-level alerts"             checked={notifs.emailWarning}   onChange={v => notifsSet('emailWarning', v)}  />
                  <ToggleRow label="Critical alerts only"   sub="Suppress low-priority notifications"               checked={notifs.criticalOnly}   onChange={v => notifsSet('criticalOnly', v)}  />
                </div>
              </SettingsSection>
              <SettingsSection title="Push Notifications" description="Browser and mobile push alerts.">
                <div className="bg-slate-900/40 rounded-xl border border-slate-700/50 px-4">
                  <ToggleRow label="Push notifications" sub="Enable browser push for all alert levels" checked={notifs.pushAll} onChange={v => notifsSet('pushAll', v)} />
                </div>
              </SettingsSection>
              <SettingsSection title="Integrations" description="Connect to third-party alert channels.">
                <div className="bg-slate-900/40 rounded-xl border border-slate-700/50 px-4 divide-y divide-slate-800/60">
                  <ToggleRow label="Webhook alerts"  sub="POST alert payloads to a custom endpoint" checked={notifs.webhookEnabled} onChange={v => notifsSet('webhookEnabled', v)} />
                  <ToggleRow label="Slack alerts"    sub="Send alerts to a Slack channel"           checked={notifs.slackEnabled}   onChange={v => notifsSet('slackEnabled', v)}   />
                </div>
              </SettingsSection>
            </div>
          )}

          {/* Site & Model Tab */}
          {activeTab === 'model' && (
            <div>
              <SettingsSection title="Active Site" description="Select the monitoring site for this session.">
                <div className="mb-4">
                  <label className="text-xs text-slate-400 mb-1.5 block">Active Site</label>
                  <select
                    value={modelSettings.site}
                    onChange={e => modelSet('site', e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  >
                    {sites.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </SettingsSection>
              <SettingsSection title="AI Model Configuration" description="Adjust detection model and performance settings.">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Detection Model</label>
                    <select
                      value={modelSettings.model}
                      onChange={e => modelSet('model', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    >
                      <option>YOLO11 PPE Detector</option>
                      <option>YOLO11 PPE Detector (Nano)</option>
                      <option>YOLOv8 PPE v2</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Stream Resolution</label>
                    <select
                      value={modelSettings.resolution}
                      onChange={e => modelSet('resolution', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    >
                      <option>1920x1080</option>
                      <option>1280x720</option>
                      <option>854x480</option>
                    </select>
                  </div>
                  <InputRow label="Confidence Threshold (%)" value={modelSettings.confidence} onChange={v => modelSet('confidence', v)} type="number" placeholder="75" />
                  <InputRow label="FPS Cap"                  value={modelSettings.fpsCap}     onChange={v => modelSet('fpsCap', v)}     type="number" placeholder="15" />
                </div>
              </SettingsSection>
              <SettingsSection title="Hardware" description="AI inference hardware status.">
                <div className="bg-slate-900/40 rounded-xl border border-slate-700/50 px-4 divide-y divide-slate-800/60">
                  <ToggleRow label="AI Engine Active" sub="Toggle YOLO11 inference on/off" checked={isAIActive} onChange={setIsAIActive} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'GPU',    value: 'RTX 4060 · 8 GB', ok: true  },
                    { label: 'VRAM',   value: '5.2 / 8 GB used',  ok: true  },
                    { label: 'Driver', value: '546.01',           ok: true  },
                  ].map(h => (
                    <div key={h.label} className="bg-slate-900/40 rounded-lg border border-slate-700/40 p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">{h.label}</div>
                        <div className="text-sm text-slate-200 font-medium">{h.value}</div>
                      </div>
                      <Check className="w-4 h-4 text-emerald-400" />
                    </div>
                  ))}
                </div>
              </SettingsSection>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div>
              <SettingsSection title="API Access" description="Manage API keys for external integrations.">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">API Key</label>
                  <div className="flex gap-2">
                    <input
                      value={integrations.apiKey}
                      readOnly
                      className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-400 font-mono focus:outline-none"
                    />
                    <button className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600/50 rounded-lg text-sm font-medium transition-colors">
                      Regenerate
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">Use this key for REST API access. Keep it secret.</p>
                </div>
              </SettingsSection>
              <SettingsSection title="Webhook" description="Receive alert payloads via HTTP POST.">
                <InputRow label="Webhook URL" value={integrations.webhookUrl} onChange={v => intSet('webhookUrl', v)} placeholder="https://your-server.com/webhook" type="url" />
                <button className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600/50 rounded-lg text-sm font-medium transition-colors">
                  Test Webhook
                </button>
              </SettingsSection>
              <SettingsSection title="Slack Integration" description="Post alerts directly to a Slack channel.">
                <InputRow label="Slack Webhook URL" value={integrations.slackWebhook} onChange={v => intSet('slackWebhook', v)} placeholder="https://hooks.slack.com/services/…" type="url" />
              </SettingsSection>
            </div>
          )}
        </div>
      </div>

      {/* Save Footer */}
      {dirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900 border border-amber-500/30 rounded-2xl px-6 py-3 shadow-2xl z-40">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span className="text-sm text-slate-300">You have unsaved settings</span>
          <button onClick={discard} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors">
            Discard
          </button>
          <button onClick={save} className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-[0_0_12px_rgba(16,185,129,0.4)]">
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
