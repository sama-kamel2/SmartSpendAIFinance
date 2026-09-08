import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, ArrowLeftRight, Wallet, BarChart3, Sparkles, Settings as SettingsIcon, Moon, Sun, LogOut, Menu, X, Globe } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { LANGUAGES, type Language } from '../lib/i18n'

export default function Layout() {
  const { user, profile, signOut } = useAuth()
  const { theme, toggleTheme, language, setLanguage, t, rtl } = useSettings()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  const nav = [
    { to: '/', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/transactions', label: t('transactions'), icon: ArrowLeftRight },
    { to: '/budgets', label: t('budgets'), icon: Wallet },
    { to: '/reports', label: t('reports'), icon: BarChart3 },
    { to: '/ai', label: t('aiAssistant'), icon: Sparkles },
    { to: '/settings', label: t('settings'), icon: SettingsIcon },
  ]

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  function changeLang(l: Language) {
    setLanguage(l)
    setLangOpen(false)
  }

  const initials = (profile?.display_name || user?.email || 'U')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const currentLang = LANGUAGES.find((l) => l.code === language)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f0d]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 ${rtl ? 'right-0 border-l' : 'left-0 border-r'} z-40 w-64 transform border-black/5 bg-white transition-transform dark:border-white/10 dark:bg-[#0e1612] lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : rtl ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-base font-bold leading-none text-slate-900 dark:text-white">{t('appName')}</p>
            <p className="text-[11px] font-medium text-brand-600 dark:text-brand-400">{t('appTagline')}</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="ml-auto rounded-lg p-1.5 text-slate-500 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-black/5 p-3 dark:border-white/10">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {profile?.display_name || 'My Account'}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
            <button onClick={handleSignOut} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-white/5" title={t('signOut')}>
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className={rtl ? 'lg:pr-64' : 'lg:pl-64'}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-black/5 bg-white/80 px-4 backdrop-blur-md dark:border-white/10 dark:bg-[#0e1612]/80 sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 lg:hidden dark:text-slate-300">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <Globe className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">{currentLang?.flag} {currentLang?.native}</span>
              <span className="sm:hidden">{currentLang?.flag}</span>
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setLangOpen(false)} />
                <div className={`absolute z-40 mt-2 w-44 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#121a16] ${rtl ? 'left-0' : 'right-0'}`}>
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => changeLang(l.code)}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${
                        language === l.code ? 'font-semibold text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-base">{l.flag}</span>
                      {l.native}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="rounded-xl border border-black/10 bg-white p-2.5 text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            aria-label={t('toggleTheme')}
          >
            {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </button>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-fade-in mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
