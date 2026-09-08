import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle, BarChart3, PieChart as PieChartLucide } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts'
import { useData } from '../lib/useData'
import { useSettings } from '../context/SettingsContext'
import { formatCurrency, monthKey, monthLabel, lastNMonthsKeys } from '../lib/format'
import { monthlyStats, categoryBreakdown, behaviorAnalysis, detectAnomalies, predictNextMonthExpense } from '../lib/ai'
import { StatCard, SectionCard, EmptyState } from '../components/ui'

const PIE_COLORS = ['#2d9a6c', '#3b82f6', '#f97316', '#ec4899', '#a855f7', '#14b8a6', '#ef4444', '#64748b', '#0ea5e9', '#8b5cf6']

export default function Dashboard() {
  const { transactions, budgets, loading } = useData()
  const { currency, t } = useSettings()
  const thisMonth = monthKey(new Date())
  const months = useMemo(() => lastNMonthsKeys(6), [])

  const stats = useMemo(() => monthlyStats(transactions, thisMonth), [transactions, thisMonth])
  const totalBalance = useMemo(() => transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0), [transactions])
  const expenseCats = useMemo(() => categoryBreakdown(transactions, 'expense', thisMonth), [transactions, thisMonth])
  const monthlyData = useMemo(
    () =>
      months.map((m) => ({
        month: monthLabel(m).split(' ')[0],
        income: monthlyStats(transactions, m).income,
        expense: monthlyStats(transactions, m).expense,
      })),
    [transactions, months]
  )
  const insights = useMemo(() => behaviorAnalysis(transactions), [transactions])
  const anomalies = useMemo(() => detectAnomalies(transactions).slice(0, 3), [transactions])
  const predicted = useMemo(() => predictNextMonthExpense(transactions), [transactions])
  const recent = useMemo(() => transactions.slice(0, 6), [transactions])

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{monthLabel(thisMonth)} · {t('financialOverview')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title={t('currentBalance')} value={formatCurrency(totalBalance, currency)} icon={<Wallet className="h-5 w-5 text-white" />} accent="bg-brand-600" sub={t('allTimeNet')} />
        <StatCard title={t('incomeMonth')} value={formatCurrency(stats.income, currency)} icon={<TrendingUp className="h-5 w-5 text-white" />} accent="bg-emerald-500" sub={`${monthLabel(thisMonth)}`} />
        <StatCard title={t('expensesMonth')} value={formatCurrency(stats.expense, currency)} icon={<TrendingDown className="h-5 w-5 text-white" />} accent="bg-rose-500" sub={`${monthLabel(thisMonth)}`} />
        <StatCard title={t('savingsMonth')} value={formatCurrency(stats.balance, currency)} icon={<PiggyBank className="h-5 w-5 text-white" />} accent="bg-sky-500" sub={stats.income > 0 ? `${((stats.balance / stats.income) * 100).toFixed(0)}% ${t('ofIncome')}` : '—'} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title={t('incomeVsExpenses')} className="lg:col-span-2">
          {monthlyData.every((d) => d.income === 0 && d.expense === 0) ? (
            <EmptyState icon={<BarChartIcon />} title={t('noDataYet')} sub={t('addTransactionsTrends')} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2d9a6c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2d9a6c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff' }}
                  formatter={(v: number) => formatCurrency(v, currency)}
                />
                <Area type="monotone" dataKey="income" name="Income" stroke="#2d9a6c" strokeWidth={2} fill="url(#gInc)" />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fill="url(#gExp)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title={t('spendingDistribution')}>
          {expenseCats.length === 0 ? (
            <EmptyState icon={<PieChartIcon />} title={t('noExpenses')} sub={t('trackSpending')} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expenseCats} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {expenseCats.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {expenseCats.slice(0, 4).map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {c.name}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{formatCurrency(c.value, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* AI insights + Prediction */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title={t('aiQuickInsights')} className="lg:col-span-2" action={<Link to="/ai" className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">{t('viewAll')} →</Link>}>
          {insights.length === 0 ? (
            <EmptyState icon={<Sparkles className="h-6 w-6" />} title={t('insightsAppear')} sub={t('addMonthsData')} />
          ) : (
            <ul className="space-y-3">
              {insights.slice(0, 4).map((ins, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{ins}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title={t('spendingPrediction')}>
          <div className="flex flex-col items-center py-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
              <Sparkles className="h-9 w-9 text-brand-600 dark:text-brand-400" />
            </div>
            {predicted > 0 ? (
              <>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{t('predictedNextMonth')}</p>
                <p className="mt-1 font-display text-2xl font-bold text-brand-600 dark:text-brand-400">{formatCurrency(predicted, currency)}</p>
                <p className="mt-1 text-xs text-slate-400">{t('basedOnRegression')}</p>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t('noDataYet')}</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Recent transactions + anomaly alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title={t('recentTransactions')} className="lg:col-span-2" action={<Link to="/transactions" className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">{t('viewAll')} →</Link>}>
          {recent.length === 0 ? (
            <EmptyState icon={<Wallet className="h-6 w-6" />} title={t('noTransactionsYet')} sub={t('addFirst')} />
          ) : (
            <div className="space-y-2">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'}`}>
                    {t.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{t.category_name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{new Date(t.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {t.payment_method}</p>
                  </div>
                  <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={t('anomalyAlerts')}>
          {anomalies.length === 0 ? (
            <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title={t('noAnomalies')} sub={t('unusualSpending')} />
          ) : (
            <ul className="space-y-3">
              {anomalies.map((a, i) => (
                <li key={i} className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{a.tx.category_name}</p>
                  </div>
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400/80">
                    {formatCurrency(a.tx.amount, currency)} — {t('wellAboveAvg')} {formatCurrency(a.avg, currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

function BarChartIcon() {
  return <BarChart3 className="h-6 w-6 text-slate-400" />
}
function PieChartIcon() {
  return <PieChartLucide className="h-6 w-6 text-slate-400" />
}
