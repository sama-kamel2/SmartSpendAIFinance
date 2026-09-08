import { useMemo, useState } from 'react'
import { BarChart3, PieChart as PieIcon, TrendingUp, Calendar } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts'
import { useData } from '../lib/useData'
import { useSettings } from '../context/SettingsContext'
import { formatCurrency, monthKey, monthLabel, lastNMonthsKeys } from '../lib/format'
import { monthlyStats, categoryBreakdown } from '../lib/ai'
import { SectionCard, EmptyState } from '../components/ui'

const PIE_COLORS = ['#2d9a6c', '#3b82f6', '#f97316', '#ec4899', '#a855f7', '#14b8a6', '#ef4444', '#64748b', '#0ea5e9', '#8b5cf6']

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

export default function Reports() {
  const { transactions, loading } = useData()
  const { currency, t } = useSettings()
  const [period, setPeriod] = useState<Period>('monthly')
  const [reportType, setReportType] = useState<'category' | 'incomeVsExpense' | 'trend'>('category')

  const months = useMemo(() => lastNMonthsKeys(6), [])

  const monthlyData = useMemo(
    () =>
      months.map((m) => {
        const s = monthlyStats(transactions, m)
        return { month: monthLabel(m).split(' ')[0], income: s.income, expense: s.expense, savings: s.balance }
      }),
    [transactions, months]
  )

  const expenseCats = useMemo(() => categoryBreakdown(transactions, 'expense'), [transactions])
  const incomeCats = useMemo(() => categoryBreakdown(transactions, 'income'), [transactions])

  // daily data for current month
  const dailyData = useMemo(() => {
    const thisMonth = monthKey(new Date())
    const days = new Map<string, number>()
    for (const t of transactions) {
      if (monthKey(new Date(t.transaction_date)) === thisMonth && t.type === 'expense') {
        const d = t.transaction_date.slice(8)
        days.set(d, (days.get(d) ?? 0) + t.amount)
      }
    }
    return Array.from(days.entries())
      .map(([day, value]) => ({ day: `Day ${parseInt(day)}`, value }))
      .sort((a, b) => parseInt(a.day.slice(4)) - parseInt(b.day.slice(4)))
  }, [transactions])

  // weekly for current month
  const weeklyData = useMemo(() => {
    const thisMonth = monthKey(new Date())
    const weeks = [0, 0, 0, 0, 0]
    for (const t of transactions) {
      if (monthKey(new Date(t.transaction_date)) === thisMonth && t.type === 'expense') {
        const day = parseInt(t.transaction_date.slice(8))
        const w = Math.min(4, Math.floor((day - 1) / 7))
        weeks[w] += t.amount
      }
    }
    return weeks.map((value, i) => ({ week: `Week ${i + 1}`, value }))
  }, [transactions])

  // yearly
  const yearlyData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>()
    for (const t of transactions) {
      const y = t.transaction_date.slice(0, 4)
      const cur = map.get(y) ?? { income: 0, expense: 0 }
      if (t.type === 'income') cur.income += t.amount
      else cur.expense += t.amount
      map.set(y, cur)
    }
    return Array.from(map.entries())
      .map(([year, v]) => ({ year, ...v }))
      .sort((a, b) => a.year.localeCompare(b.year))
  }, [transactions])

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" /></div>

  const periodData = period === 'daily' ? dailyData : period === 'weekly' ? weeklyData : period === 'yearly' ? yearlyData : monthlyData

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{t('reports')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('visualizeData')}</p>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap gap-2">
        {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              period === p ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 dark:bg-white/5 dark:text-slate-300'
            }`}
          >
            <Calendar className="h-4 w-4" /> {t(p)}
          </button>
        ))}
      </div>

      {/* Spending distribution pie */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title={t('expenseDistribution')}>
          {expenseCats.length === 0 ? (
            <EmptyState icon={<PieIcon className="h-6 w-6" />} title={t('noExpenseData')} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={expenseCats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: { name: string }) => e.name} labelLine={false}>
                    {expenseCats.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {expenseCats.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} /> {c.name}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(c.value, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title={t('incomeSources')}>
          {incomeCats.length === 0 ? (
            <EmptyState icon={<TrendingUp className="h-6 w-6" />} title={t('noIncomeData')} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={incomeCats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: { name: string }) => e.name} labelLine={false}>
                    {incomeCats.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[(i + 2) % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {incomeCats.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[(i + 2) % PIE_COLORS.length] }} /> {c.name}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(c.value, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Income vs Expense bar */}
      <SectionCard title={t('monthlyComparison')}>
        {monthlyData.every((d) => d.income === 0 && d.expense === 0) ? (
          <EmptyState icon={<BarChart3 className="h-6 w-6" />} title={t('noDataYet')} />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="income" name="Income" fill="#2d9a6c" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Period chart */}
      <SectionCard title={`${period.charAt(0).toUpperCase() + period.slice(1)} ${t('periodReport')}`}>
        {periodData.length === 0 ? (
          <EmptyState icon={<BarChart3 className="h-6 w-6" />} title={t('noDataPeriod')} />
        ) : period === 'yearly' ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={yearlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="income" name="Income" fill="#2d9a6c" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : period === 'daily' || period === 'weekly' ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={periodData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
              <XAxis dataKey={period === 'daily' ? 'day' : 'week'} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Line type="monotone" dataKey="value" name="Expense" stroke="#2d9a6c" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Line type="monotone" dataKey="income" name="Income" stroke="#2d9a6c" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="savings" name="Savings" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SectionCard>
    </div>
  )
}
