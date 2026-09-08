import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Briefcase, Laptop, Building2, Check, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { formatCurrency } from '../lib/format'

type ProfileType = 'student' | 'employee' | 'freelancer' | 'business'

const PROFILE_ICONS: Record<ProfileType, typeof GraduationCap> = {
  student: GraduationCap,
  employee: Briefcase,
  freelancer: Laptop,
  business: Building2,
}

export default function SetupWizard() {
  const { completeSetup } = useAuth()
  const { t, currency, rtl } = useSettings()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [profileType, setProfileType] = useState<ProfileType | null>(null)
  const [data, setData] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const profiles: { type: ProfileType; label: string; desc: string }[] = [
    { type: 'student', label: t('student'), desc: t('studentDesc') },
    { type: 'employee', label: t('employee'), desc: t('employeeDesc') },
    { type: 'freelancer', label: t('freelancer'), desc: t('freelancerDesc') },
    { type: 'business', label: t('business'), desc: t('businessDesc') },
  ]

  const FIELDS: Record<ProfileType, { key: string; label: string; optional?: boolean }[]> = {
    student: [
      { key: 'allowance', label: t('monthlyAllowance') },
      { key: 'scholarship', label: t('scholarshipIncome'), optional: true },
      { key: 'partTime', label: t('partTimeIncome'), optional: true },
      { key: 'fixedExpenses', label: t('fixedMonthlyExpenses') },
      { key: 'dailyExpenses', label: t('estimatedDailyExpenses') },
      { key: 'budget', label: t('monthlyBudget') },
      { key: 'savingsGoal', label: t('savingsGoal') },
    ],
    employee: [
      { key: 'salary', label: t('monthlySalary') },
      { key: 'additionalIncome', label: t('additionalIncome') },
      { key: 'fixedBills', label: t('fixedMonthlyBills') },
      { key: 'transport', label: t('transportExpenses') },
      { key: 'dailyExpenses', label: t('dailyExpenses') },
      { key: 'budget', label: t('monthlyBudget') },
      { key: 'savingsGoal', label: t('savingsGoal') },
    ],
    freelancer: [
      { key: 'avgIncome', label: t('avgMonthlyIncome') },
      { key: 'projectIncome', label: t('projectIncome') },
      { key: 'clientPayments', label: t('clientPayments') },
      { key: 'businessExpenses', label: t('businessExpenses') },
      { key: 'personalExpenses', label: t('personalExpenses') },
      { key: 'budget', label: t('monthlyBudget') },
      { key: 'savingsGoal', label: t('savingsGoal') },
    ],
    business: [
      { key: 'revenue', label: t('monthlyBusinessRevenue') },
      { key: 'businessExpenses', label: t('businessExpenses') },
      { key: 'employeeSalaries', label: t('employeeSalaries') },
      { key: 'operatingCosts', label: t('operatingCosts') },
      { key: 'personalIncome', label: t('personalIncome') },
      { key: 'budget', label: t('monthlyBudget') },
      { key: 'profitTarget', label: t('profitTarget') },
    ],
  }

  function selectProfile(type: ProfileType) {
    setProfileType(type)
    setStep(1)
  }

  function handleVal(key: string, val: string) {
    setData((d) => ({ ...d, [key]: val }))
  }

  async function finish() {
    if (!profileType) return
    setBusy(true)
    const wizardData: Record<string, number | string | null> = {}
    for (const [k, v] of Object.entries(data)) {
      const num = parseFloat(v)
      wizardData[k] = isNaN(num) ? null : num
    }
    await completeSetup(profileType, wizardData)
    setBusy(false)
    setStep(2)
  }

  const totalSteps = 3

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0a0f0d]">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-500/10" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10" />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="font-display text-lg font-bold text-slate-900 dark:text-white">{t('appName')} AI</p>
        </div>

        {/* Progress */}
        {step < 2 && (
          <div className="mb-8 flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-brand-600' : 'bg-slate-200 dark:bg-white/10'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 0: Choose profile */}
        {step === 0 && (
          <div className="animate-fade-in">
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">{t('setupTitle')}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('setupSubtitle')}</p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profiles.map(({ type, label, desc }) => {
                const Icon = PROFILE_ICONS[type]
                return (
                  <button
                    key={type}
                    onClick={() => selectProfile(type)}
                    className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-brand-500 hover:shadow-md dark:border-white/10 dark:bg-[#121a16] dark:hover:border-brand-500/50"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-500/15 dark:text-brand-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-display text-base font-bold text-slate-900 dark:text-white">{label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 1: Financial info */}
        {step === 1 && profileType && (
          <div className="animate-fade-in">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
              {PROFILE_ICONS[profileType] && (() => { const Icon = PROFILE_ICONS[profileType]; return <Icon className="h-4 w-4" /> })()}
              {t(profileType)}
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{t('financialInfo')}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('financialInfoDesc')}</p>

            <div className="mt-6 space-y-4">
              {FIELDS[profileType].map((field) => (
                <div key={field.key}>
                  <label className="label">
                    {field.label}
                    {field.optional && <span className="ml-1.5 normal-case text-slate-400">({t('optional')})</span>}
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      {formatCurrency(0, currency).replace(/0\.00/, '').trim() || ''}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input pl-10"
                      placeholder="0.00"
                      value={data[field.key] ?? ''}
                      onChange={(e) => handleVal(field.key, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => setStep(0)} className="btn-ghost flex-1">
                {rtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />} {t('back')}
              </button>
              <button onClick={finish} disabled={busy} className="btn-primary flex-1">
                {busy ? t('pleaseWait') : t('finish')} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Complete */}
        {step === 2 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center animate-fade-in">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
              <Check className="h-10 w-10" />
            </div>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">{t('setupComplete')}</h1>
            <p className="mt-3 max-w-sm text-sm text-slate-500 dark:text-slate-400">{t('setupCompleteDesc')}</p>
            <button onClick={() => navigate('/')} className="btn-primary mt-8 px-6 py-3 text-base">
              {t('goToDashboard')} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
