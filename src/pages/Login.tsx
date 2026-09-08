import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Sparkles, Mail, Lock, User, Check, ArrowLeft, Globe } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { LANGUAGES, type Language } from '../lib/i18n'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const { t, language, setLanguage } = useSettings()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError(t('pleaseFill'))
      return
    }
    if (mode === 'signup' && !name.trim()) {
      setError(t('enterName'))
      return
    }
    setBusy(true)
    const { error } = mode === 'login' ? await signIn(email, password, remember) : await signUp(email, password, name)
    setBusy(false)
    if (error) setError(error)
    else navigate('/')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0a0f0d]">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-500/10" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10" />

      {/* Language switcher */}
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
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
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-2">
        {/* Left brand panel */}
        <div className="hidden flex-col justify-between p-12 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-slate-900 dark:text-white">{t('appName')} AI</p>
              <p className="text-sm text-brand-600 dark:text-brand-400">{t('appTagline')}</p>
            </div>
          </div>
          <div className="max-w-md">
            <h1 className="font-display text-4xl font-extrabold leading-tight text-slate-900 dark:text-white">
              {t('welcomeTitle')}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
              {t('welcomeSubtitle')}
            </p>
            <ul className="mt-8 space-y-3">
              {[t('featPrediction'), t('featAnomaly'), t('featSaving'), t('featReports')].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-400">{t('welcomeFooter')}</p>
        </div>

        {/* Right form panel */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md animate-fade-in">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="font-display text-lg font-bold text-slate-900 dark:text-white">{t('appName')} AI</p>
            </div>

            <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
              <ArrowLeft className="h-4 w-4" /> {t('backHome')}
            </Link>

            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {mode === 'login' ? t('welcomeBack') : t('createAccount')}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {mode === 'login' ? t('signInContinue') : t('signUpStart')}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="label">{t('fullName')}</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input className="input pl-10" placeholder={t('yourName')} value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                </div>
              )}
              <div>
                <label className="label">{t('email')}</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-10" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">{t('password')}</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-10 pr-10" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <label className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  {t('rememberMe')}
                </label>
              )}

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? t('pleaseWait') : mode === 'login' ? t('signIn') : t('signUp')}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {mode === 'login' ? t('noAccount') : t('haveAccount')}
              <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }} className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
                {mode === 'login' ? t('signUp') : t('signIn')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
