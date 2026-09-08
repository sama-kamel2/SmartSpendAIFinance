import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search, ArrowUpRight, ArrowDownRight, Wand2, X } from 'lucide-react'
import { useData } from '../lib/useData'
import { useSettings } from '../context/SettingsContext'
import { formatCurrency, formatDate, monthLabel, monthKey } from '../lib/format'
import { autoClassify } from '../lib/ai'
import { SectionCard, Modal, EmptyState } from '../components/ui'
import type { Transaction } from '../lib/supabase'

const PAYMENT_METHODS = ['cash', 'credit card', 'debit card', 'bank transfer', 'mobile payment', 'other']

export default function Transactions() {
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction } = useData()
  const { currency, t } = useSettings()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState<string>('all')

  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category_name: '',
    payment_method: 'cash',
    notes: '',
    transaction_date: new Date().toISOString().slice(0, 10),
  })

  const expenseCats = categories.filter((c) => c.type === 'expense')
  const incomeCats = categories.filter((c) => c.type === 'income')

  const availableMonths = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(new Date(t.transaction_date))))
    return Array.from(set).sort().reverse()
  }, [transactions])

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false
      if (monthFilter !== 'all' && monthKey(new Date(t.transaction_date)) !== monthFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!t.category_name.toLowerCase().includes(q) && !t.notes?.toLowerCase().includes(q) && !t.payment_method.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [transactions, filter, search, monthFilter])

  function openAdd() {
    setEditing(null)
    setForm({ type: 'expense', amount: '', category_name: '', payment_method: 'cash', notes: '', transaction_date: new Date().toISOString().slice(0, 10) })
    setModalOpen(true)
  }
  function openEdit(t: Transaction) {
    setEditing(t)
    setForm({
      type: t.type,
      amount: String(t.amount),
      category_name: t.category_name,
      payment_method: t.payment_method,
      notes: t.notes ?? '',
      transaction_date: t.transaction_date,
    })
    setModalOpen(true)
  }

  function handleAutoClassify() {
    const guess = autoClassify(form.notes || form.category_name)
    if (guess) setForm((f) => ({ ...f, category_name: guess }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) return
    const cats = form.type === 'income' ? incomeCats : expenseCats
    const cat = cats.find((c) => c.name === form.category_name)
    const payload = {
      type: form.type,
      amount,
      category_id: cat?.id ?? null,
      category_name: form.category_name || 'Uncategorized',
      payment_method: form.payment_method,
      notes: form.notes || null,
      transaction_date: form.transaction_date,
    }
    if (editing) await updateTransaction(editing.id, payload)
    else await addTransaction(payload)
    setModalOpen(false)
  }

  async function handleDelete(id: string) {
    if (confirm(t('delete'))) await deleteTransaction(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{t('transactions')}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('manageIncome')}</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="h-4 w-4" /> {t('addTransaction')}
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder={t('searchTransactions')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'
              }`}
            >
              {f === 'all' ? t('all') : t(f)}
            </button>
          ))}
        </div>
        <select className="input sm:w-44" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
          <option value="all">{t('allMonths')}</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <SectionCard title={`${filtered.length} ${t('transactions')}`}>
        {filtered.length === 0 ? (
          <EmptyState icon={<ArrowUpRight className="h-6 w-6" />} title={t('noTransactionsFound')} sub={t('adjustFilters')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-white/5">
                  <th className="pb-3 font-semibold">{t('category')}</th>
                  <th className="pb-3 font-semibold">{t('date')}</th>
                  <th className="pb-3 font-semibold">{t('method')}</th>
                  <th className="pb-3 font-semibold">{t('notes')}</th>
                  <th className="pb-3 text-right font-semibold">{t('amount')}</th>
                  <th className="pb-3 text-right font-semibold">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'}`}>
                          {t.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{t.category_name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{formatDate(t.transaction_date)}</td>
                    <td className="py-3 capitalize text-slate-500 dark:text-slate-400">{t.payment_method}</td>
                    <td className="max-w-[200px] truncate py-3 text-slate-500 dark:text-slate-400">{t.notes || '—'}</td>
                    <td className={`py-3 text-right font-semibold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(t)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-white/5">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-white/5">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('editTransaction') : t('addTransaction')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['expense', 'income'] as const).map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: tp, category_name: '' }))}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                  form.type === tp
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400'
                }`}
              >
                {t(tp)}
              </button>
            ))}
          </div>
          <div>
            <label className="label">{t('amount')}</label>
            <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="label">{t('category')}</label>
            <div className="flex gap-2">
              <select
                className="input flex-1"
                value={form.category_name}
                onChange={(e) => setForm((f) => ({ ...f, category_name: e.target.value }))}
              >
                <option value="">{t('selectCategory')}</option>
                {(form.type === 'income' ? incomeCats : expenseCats).map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <button type="button" onClick={handleAutoClassify} title={t('autoClassify')} className="btn-ghost shrink-0">
                <Wand2 className="h-4 w-4" /> AI
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('paymentMethod')}</label>
              <select className="input capitalize" value={form.payment_method} onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('date')}</label>
              <input className="input" type="date" value={form.transaction_date} onChange={(e) => setForm((f) => ({ ...f, transaction_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">{t('notes')}</label>
            <textarea className="input min-h-[80px] resize-none" placeholder={t('addNotes')} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">
              <X className="h-4 w-4" /> {t('cancel')}
            </button>
            <button type="submit" className="btn-primary flex-1">{editing ? t('save') : t('add')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
