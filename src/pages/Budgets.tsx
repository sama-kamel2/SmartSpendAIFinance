import { useMemo, useState } from 'react'
import { Plus, Trash2, Wallet, AlertTriangle, CheckCircle2, Sparkles, X } from 'lucide-react'
import { useData } from '../lib/useData'
import { useSettings } from '../context/SettingsContext'
import { formatCurrency, monthKey, monthLabel } from '../lib/format'
import { recommendBudgets } from '../lib/ai'
import { SectionCard, Modal, EmptyState, StatCard } from '../components/ui'

export default function Budgets() {
  const { budgets, categories, transactions, addBudget, deleteBudget } = useData()
  const { currency, t } = useSettings()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    category_name: '',
    limit_amount: '',
    period_month: new Date().toISOString().slice(0, 7) + '-01',
  })

  const thisMonth = monthKey(new Date())
  const expenseCats = categories.filter((c) => c.type === 'expense')

  const monthBudgets = useMemo(() => budgets.filter((b) => monthKey(new Date(b.period_month)) === thisMonth), [budgets, thisMonth])
  const totalLimit = monthBudgets.reduce((s, b) => s + b.limit_amount, 0)
  const totalSpent = useMemo(() => {
    return monthBudgets.reduce((sum, b) => {
      const spent = transactions
        .filter((t) => t.type === 'expense' && t.category_name === b.category_name && monthKey(new Date(t.transaction_date)) === thisMonth)
        .reduce((s, t) => s + t.amount, 0)
      return sum + spent
    }, 0)
  }, [monthBudgets, transactions, thisMonth])

  const budgetStatus = useMemo(
    () =>
      monthBudgets.map((b) => {
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.category_name === b.category_name && monthKey(new Date(t.transaction_date)) === thisMonth)
          .reduce((s, t) => s + t.amount, 0)
        const pct = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0
        return { ...b, spent, pct, remaining: b.limit_amount - spent, over: spent > b.limit_amount }
      }),
    [monthBudgets, transactions, thisMonth]
  )

  const recs = useMemo(() => recommendBudgets(transactions), [transactions])
  const [showRecs, setShowRecs] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const limit = parseFloat(form.limit_amount)
    if (!limit || limit <= 0 || !form.category_name) return
    await addBudget({
      category_id: expenseCats.find((c) => c.name === form.category_name)?.id ?? null,
      category_name: form.category_name,
      limit_amount: limit,
      period_month: form.period_month,
    })
    setModalOpen(false)
    setForm({ category_name: '', limit_amount: '', period_month: new Date().toISOString().slice(0, 7) + '-01' })
  }

  async function applyRec(cat: string, amount: number) {
    const existing = monthBudgets.find((b) => b.category_name === cat)
    if (existing) return
    await addBudget({
      category_id: expenseCats.find((c) => c.name === cat)?.id ?? null,
      category_name: cat,
      limit_amount: amount,
      period_month: new Date().toISOString().slice(0, 7) + '-01',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{t('budgets')}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{monthLabel(thisMonth)} · {t('trackLimits')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRecs((s) => !s)} className="btn-ghost">
            <Sparkles className="h-4 w-4" /> {t('aiRecommend')}
          </button>
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> {t('setBudget')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title={t('totalBudget')} value={formatCurrency(totalLimit, currency)} icon={<Wallet className="h-5 w-5 text-white" />} accent="bg-brand-600" />
        <StatCard title={t('totalSpent')} value={formatCurrency(totalSpent, currency)} icon={<Wallet className="h-5 w-5 text-white" />} accent="bg-sky-500" sub={`${totalLimit > 0 ? ((totalSpent / totalLimit) * 100).toFixed(0) : 0}% ${t('used')}`} />
        <StatCard title={t('remaining')} value={formatCurrency(Math.max(0, totalLimit - totalSpent), currency)} icon={<CheckCircle2 className="h-5 w-5 text-white" />} accent={totalSpent > totalLimit ? 'bg-rose-500' : 'bg-emerald-500'} sub={totalSpent > totalLimit ? t('overBudget') : t('withinBudget')} />
      </div>

      {showRecs && recs.length > 0 && (
        <SectionCard title={t('aiBudgetRecs')} action={<button onClick={() => setShowRecs(false)} className="text-slate-400"><X className="h-4 w-4" /></button>}>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">{t('recsDesc')}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {recs.slice(0, 6).map((r) => (
              <div key={r.category} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-white/5">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.category}</p>
                  <p className="text-xs text-slate-500">{t('avg')}: {formatCurrency(r.currentAvg, currency)} → {t('rec')}: {formatCurrency(r.recommended, currency)}</p>
                </div>
                <button onClick={() => applyRec(r.category, r.recommended)} className="btn-ghost px-3 py-1.5 text-xs">{t('apply')}</button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title={t('budgetProgress')}>
        {budgetStatus.length === 0 ? (
          <EmptyState icon={<Wallet className="h-6 w-6" />} title={t('noBudgets')} sub={t('createBudget')} />
        ) : (
          <div className="space-y-4">
            {budgetStatus.map((b) => (
              <div key={b.id} className="rounded-xl border border-slate-100 p-4 dark:border-white/5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{b.category_name}</span>
                    {b.over ? (
                      <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                        <AlertTriangle className="h-3 w-3" /> {t('overLimit')}
                      </span>
                    ) : b.pct >= 80 ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">{t('almostThere')}</span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> {t('onTrack')}
                      </span>
                    )}
                  </div>
                  <button onClick={() => deleteBudget(b.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">{formatCurrency(b.spent, currency)} spent</span>
                  <span className="text-slate-500 dark:text-slate-400">{formatCurrency(b.limit_amount, currency)} limit</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                  <div
                    className={`h-full rounded-full transition-all ${b.over ? 'bg-rose-500' : b.pct >= 80 ? 'bg-amber-500' : 'bg-brand-500'}`}
                    style={{ width: `${Math.min(100, b.pct)}%` }}
                  />
                </div>
                <p className={`mt-1.5 text-xs ${b.over ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                  {b.over ? `${formatCurrency(Math.abs(b.remaining), currency)} ${t('overBudgetMsg')}` : `${formatCurrency(b.remaining, currency)} ${t('budgetRemaining')}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('setBudget')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t('category')}</label>
            <select className="input" value={form.category_name} onChange={(e) => setForm((f) => ({ ...f, category_name: e.target.value }))}>
              <option value="">{t('selectCategory')}</option>
              {expenseCats.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('monthlyLimit')}</label>
            <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.limit_amount} onChange={(e) => setForm((f) => ({ ...f, limit_amount: e.target.value }))} />
          </div>
          <div>
            <label className="label">{t('month')}</label>
            <input className="input" type="month" value={form.period_month.slice(0, 7)} onChange={(e) => setForm((f) => ({ ...f, period_month: e.target.value + '-01' }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">{t('cancel')}</button>
            <button type="submit" className="btn-primary flex-1">{t('setBudget')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
