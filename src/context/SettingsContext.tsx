import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { translate, type Language, LANGUAGES } from '../lib/i18n'

type SettingsContextType = {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  currency: string
  setCurrency: (c: string) => void
  language: Language
  setLanguage: (l: Language) => void
  t: (key: string) => string
  rtl: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

function isRtl(lang: Language): boolean {
  return LANGUAGES.find((l) => l.code === lang)?.rtl ?? false
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { profile, user, refreshProfile } = useAuth()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [currency, setCurrencyState] = useState('USD')
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    if (profile) {
      setTheme(profile.theme === 'dark' ? 'dark' : 'light')
      setCurrencyState(profile.currency || 'USD')
      setLanguageState((profile.language as Language) || 'en')
    } else {
      const saved = localStorage.getItem('ss-theme') as 'light' | 'dark' | null
      if (saved) setTheme(saved)
      const savedCur = localStorage.getItem('ss-currency')
      if (savedCur) setCurrencyState(savedCur)
      const savedLang = localStorage.getItem('ss-language') as Language | null
      if (savedLang) setLanguageState(savedLang)
    }
  }, [profile])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    if (!profile) localStorage.setItem('ss-theme', theme)
  }, [theme, profile])

  useEffect(() => {
    const root = document.documentElement
    const rtl = isRtl(language)
    root.dir = rtl ? 'rtl' : 'ltr'
    root.lang = language
    if (!profile) localStorage.setItem('ss-language', language)
  }, [language, profile])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    if (user) {
      supabase.from('profiles').update({ theme: next }).eq('id', user.id).then(() => refreshProfile())
    } else {
      localStorage.setItem('ss-theme', next)
    }
  }

  function setCurrency(c: string) {
    setCurrencyState(c)
    if (user) {
      supabase.from('profiles').update({ currency: c }).eq('id', user.id).then(() => refreshProfile())
    } else {
      localStorage.setItem('ss-currency', c)
    }
  }

  function setLanguage(l: Language) {
    setLanguageState(l)
    if (user) {
      supabase.from('profiles').update({ language: l }).eq('id', user.id).then(() => refreshProfile())
    } else {
      localStorage.setItem('ss-language', l)
    }
  }

  const t = (key: string) => translate(language, key)

  return (
    <SettingsContext.Provider value={{ theme, toggleTheme, currency, setCurrency, language, setLanguage, t, rtl: isRtl(language) }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
