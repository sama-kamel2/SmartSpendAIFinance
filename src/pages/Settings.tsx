import { useState } from 'react'
import { Moon, Sun, Globe, Bell, Lock, Check, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/useData'
import { CURRENCIES } from '../lib/format'
import { LANGUAGES, type Language } from '../lib/i18n'
import { SectionCard } from '../components/ui'

export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { theme, toggleTheme, currency, setCurrency, language, setLanguage, t } = useSettings()
  const { categories, addCategory, deleteCategory } = useData()
  const [name, setName] = useState(profile?.display_name ?? '')
  const [savedName, setSavedName] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', type: 'expense' as 'income' | 'expense' })
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [notif, setNotif] = useState({
    budget: profile?.notify_budget ?? true,
    summary: profile?.notify_summary ?? true,
    saving: profile?.notify_saving ?? true,
    bills: profile?.notify_bills ?? true,
  })

  async function saveName() {
    if (!user) return
    await supabase.from('profiles').update({ display_name: name }).eq('id', user.id)
    await refreshProfile()
    setSavedName(true)
    setTimeout(() => setSavedName(false), 2000)
  }

  async function saveNotif(key: keyof typeof notif, value: boolean) {
    const next = { ...notif, [key]: value }
    setNotif(next)
    if (user) {
      const col = `notify_${key}` as const
      await supabase.from('profiles').update({ [col]: value }).eq('id', user.id)
      await refreshProfile()
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (pw.next !== pw.confirm) {
      setPwMsg({ ok: false, text: t('pwNoMatch') })
      return
    }
    if (pw.next.length < 6) {
      setPwMsg({ ok: false, text: t('pwTooShort') })
      return
    }
    if (!user?.email) return
    const { error } = await supabase.auth.updateUser({ password: pw.next })
    if (error) setPwMsg({ ok: false, text: error.message })
    else {
      setPwMsg({ ok: true, text: t('pwUpdated') })
      setPw({ current: '', next: '', confirm: '' })
    }
  }

  async function handleAddCat(e: React.FormEvent) {
    e.preventDefault()
    if (!newCat.name.trim()) return
    await addCategory({ name: newCat.name.trim(), type: newCat.type, icon: 'Tag', color: '#64748b' })
    setNewCat({ name: '', type: 'expense' })
  }

  const notifOptions: { key: keyof typeof notif; label: string; desc: string }[] = [
    { key: 'budget', label: t('budgetAlerts'), desc: t('budgetAlertsDesc') },
    { key: 'summary', label: t('monthlySummary'), desc: t('monthlySummaryDesc') },
    { key: 'saving', label: t('savingReminders'), desc: t('savingRemindersDesc') },
    { key: 'bills', label: t('billReminders'), desc: t('billRemindersDesc') },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{t('settings')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('managePreferences')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile */}
        <SectionCard title={t('profileManagement')}>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
              {(name || user?.email || 'U').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">{name || 'Your name'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              {profile?.profile_type && (
                <span className="mt-1 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  {t(profile.profile_type)}
                </span>
              )}
            </div>
          </div>
          <label className="label">{t('displayName')}</label>
          <div className="flex gap-2">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('yourName')} />
            <button onClick={saveName} className="btn-primary shrink-0">
              {savedName ? <Check className="h-4 w-4" /> : null} {t('save')}
            </button>
          </div>
        </SectionCard>

        {/* Appearance */}
        <SectionCard title={t('appearance')}>
          <label className="label">{t('theme')}</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => theme === 'dark' && toggleTheme()} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${theme === 'light' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'border-slate-200 text-slate-500 dark:border-white/10'}`}>
              <Sun className="h-4 w-4" /> {t('light')}
            </button>
            <button onClick={() => theme === 'light' && toggleTheme()} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${theme === 'dark' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'border-slate-200 text-slate-500 dark:border-white/10'}`}>
              <Moon className="h-4 w-4" /> {t('dark')}
            </button>
          </div>
          <label className="label mt-4">{t('currency')}</label>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select className="input pl-10" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {Object.entries(CURRENCIES).map(([code, c]) => (
                <option key={code} value={code}>{c.symbol} {code} — {c.label}</option>
              ))}
            </select>
          </div>
          <label className="label mt-4">{t('language')}</label>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select className="input pl-10" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.native} — {l.label}</option>
              ))}
            </select>
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard title={t('notificationSettings')}>
          <div className="space-y-3">
            {notifOptions.map((n) => (
              <label key={n.key} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{n.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => saveNotif(n.key, !notif[n.key])}
                  className={`relative h-6 w-11 rounded-full transition-colors ${notif[n.key] ? 'bg-brand-600' : 'bg-slate-300 dark:bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notif[n.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </label>
            ))}
          </div>
        </SectionCard>

        {/* Change password */}
        <SectionCard title={t('changePassword')}>
          <form onSubmit={changePassword} className="space-y-3">
            <div>
              <label className="label">{t('newPassword')}</label>
              <input className="input" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="••••••••" />
            </div>
            <div>
              <label className="label">{t('confirmPassword')}</label>
              <input className="input" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} placeholder="••••••••" />
            </div>
            {pwMsg && (
              <div className={`rounded-xl px-3.5 py-2.5 text-sm ${pwMsg.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'}`}>
                {pwMsg.text}
              </div>
            )}
            <button type="submit" className="btn-primary w-full">
              <Lock className="h-4 w-4" /> {t('updatePassword')}
            </button>
          </form>
        </SectionCard>
      </div>

      {/* Categories management */}
      <SectionCard title={t('manageCategories')}>
        <form onSubmit={handleAddCat} className="mb-4 flex flex-wrap gap-2">
          <input className="input flex-1" placeholder={t('newCategoryName')} value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
          <select className="input w-32" value={newCat.type} onChange={(e) => setNewCat({ ...newCat, type: e.target.value as 'income' | 'expense' })}>
            <option value="expense">{t('expense')}</option>
            <option value="income">{t('income')}</option>
          </select>
          <button type="submit" className="btn-primary shrink-0">
            <Plus className="h-4 w-4" /> {t('add')}
          </button>
        </form>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 dark:border-white/5">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</p>
                <p className="text-xs capitalize text-slate-400">{c.type}{c.is_default ? ` · ${t('default')}` : ''}</p>
              </div>
              {!c.is_default && (
                <button onClick={() => deleteCategory(c.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-rose-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Sign out */}
      <div className="flex justify-center pt-2">
        <button onClick={signOut} className="btn-ghost text-rose-600 dark:text-rose-400">
          {t('signOutAccount')}
        </button>
      </div>
    </div>
  )
}
