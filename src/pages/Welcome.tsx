import { Link } from 'react-router-dom'
import { Sparkles, TrendingUp, ShieldCheck, Bot, ArrowRight, PiggyBank, BarChart3, Bell, Globe } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { LANGUAGES, type Language } from '../lib/i18n'

export default function Welcome() {
  const { t, language, setLanguage } = useSettings()

  const features = [
    { icon: TrendingUp, title: t('featPrediction'), desc: t('featPredictionDesc') },
    { icon: Bot, title: t('featAssistant'), desc: t('featAssistantDesc') },
    { icon: ShieldCheck, title: t('featAnomaly'), desc: t('featAnomalyDesc') },
    { icon: PiggyBank, title: t('featSaving'), desc: t('featSavingDesc') },
    { icon: BarChart3, title: t('featReports'), desc: t('featReportsDesc') },
    { icon: Bell, title: t('featBudgetAlerts'), desc: t('featBudgetAlertsDesc') },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0a0f0d]">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-500/10" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6">
        {/* Nav */}
        <nav className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-none text-slate-900 dark:text-white">{t('appName')}</p>
              <p className="text-[11px] font-medium text-brand-600 dark:text-brand-400">{t('appTagline')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="appearance-none rounded-xl border border-black/10 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.flag} {l.native}</option>
                ))}
              </select>
              <Globe className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <Link to="/login" className="btn-ghost px-4 py-2 text-sm">
              {t('signIn')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> {t('welcomeBadge')}
          </span>
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            {t('welcomeTitle')}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
            {t('welcomeSubtitle')}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/login" className="btn-primary px-6 py-3 text-base">
              {t('getStarted')} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn-ghost px-6 py-3 text-base">
              {t('signInAccount')}
            </Link>
          </div>
        </section>

        {/* Features grid */}
        <section className="grid grid-cols-1 gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-5 transition-all hover:shadow-md">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </section>

        <footer className="border-t border-black/5 py-6 text-center text-xs text-slate-400 dark:border-white/10">
          {t('welcomeFooter')}
        </footer>
      </div>
    </div>
  )
}
