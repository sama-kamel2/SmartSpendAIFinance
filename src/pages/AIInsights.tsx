import { useMemo, useState, useRef, useEffect } from 'react'
import { Sparkles, TrendingUp, AlertTriangle, PiggyBank, Send, Bot, User, Wand2, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useData } from '../lib/useData'
import { useSettings } from '../context/SettingsContext'
import { formatCurrency, monthKey, monthLabel } from '../lib/format'
import {
  predictNextMonthExpense,
  forecastMonthlyExpenses,
  detectAnomalies,
  behaviorAnalysis,
  recommendBudgets,
  savingTips,
  monthlySummary,
  answerChatbot,
} from '../lib/ai'
import { SectionCard, EmptyState } from '../components/ui'

type ChatMsg = { role: 'user' | 'bot'; text: string }

export default function AIInsights() {
  const { transactions, budgets } = useData()
  const { currency, t } = useSettings()
  const thisMonth = monthKey(new Date())

  const predicted = useMemo(() => predictNextMonthExpense(transactions), [transactions])
  const forecast = useMemo(() => forecastMonthlyExpenses(transactions), [transactions])
  const anomalies = useMemo(() => detectAnomalies(transactions), [transactions])
  const behavior = useMemo(() => behaviorAnalysis(transactions), [transactions])
  const recs = useMemo(() => recommendBudgets(transactions), [transactions])
  const tips = useMemo(() => savingTips(transactions), [transactions])
  const summary = useMemo(() => monthlySummary(transactions, budgets, thisMonth), [transactions, budgets, thisMonth])

  const [chat, setChat] = useState<ChatMsg[]>([
    { role: 'bot', text: t('chatGreeting') },
  ])
  const [input, setInput] = useState('')
  const chatEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  function sendChat() {
    if (!input.trim()) return
    const q = input.trim()
    setChat((c) => [...c, { role: 'user', text: q }])
    const answer = answerChatbot(q, transactions, budgets, currency)
    setChat((c) => [...c, { role: 'bot', text: answer }])
    setInput('')
  }

  const quickQuestions = [
    'qSpentMonth',
    'qHighestCategory',
    'qSaveMore',
    'qCompare',
    'qAnomalies',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{t('aiAssistant')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('intelligentInsights')}</p>
      </div>

      {/* AI Monthly Summary */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 bg-gradient-to-r from-brand-600 to-brand-700 p-5 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold">{t('aiMonthlySummary')}</h3>
            <p className="text-xs text-white/80">{monthLabel(thisMonth)}</p>
          </div>
        </div>
        <div className="p-5">
          {summary ? (
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{summary}</p>
          ) : (
            <EmptyState icon={<FileText className="h-6 w-6" />} title={t('notEnoughSummary')} sub={t('addTransactionsSummary')} />
          )}
        </div>
      </div>

      {/* Prediction + Forecast */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title={t('spendingPrediction')} action={<Sparkles className="h-5 w-5 text-brand-500" />}>
          <div className="flex flex-col items-center py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('predictedNextMonth')}</p>
            <p className="mt-2 font-display text-4xl font-bold text-brand-600 dark:text-brand-400">{formatCurrency(predicted, currency)}</p>
            <p className="mt-2 text-xs text-slate-400">{t('basedOnRegression')}</p>
          </div>
        </SectionCard>

        <SectionCard title={t('expenseForecasting')} action={<TrendingUp className="h-5 w-5 text-sky-500" />}>
          {forecast.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={forecast} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v: string) => monthLabel(v).split(' ')[0]} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Line type="monotone" dataKey="predicted" name="Forecast" stroke="#0ea5e9" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={<TrendingUp className="h-6 w-6" />} title={t('noForecast')} />
          )}
        </SectionCard>
      </div>

      {/* Behavior analysis + Anomalies */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title={t('behaviorAnalysis')} action={<Sparkles className="h-5 w-5 text-brand-500" />}>
          {behavior.length === 0 ? (
            <EmptyState icon={<Sparkles className="h-6 w-6" />} title={t('noPatterns')} />
          ) : (
            <ul className="space-y-2.5">
              {behavior.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">{b}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title={t('anomalyDetection')} action={<AlertTriangle className="h-5 w-5 text-amber-500" />}>
          {anomalies.length === 0 ? (
            <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title={t('noAnomaliesDetected')} sub={t('unusualAppear')} />
          ) : (
            <ul className="space-y-2.5">
              {anomalies.slice(0, 5).map((a, i) => (
                <li key={i} className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">{a.tx.category_name}</span>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{formatCurrency(a.tx.amount, currency)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400/80">
                    Avg: {formatCurrency(a.avg, currency)} · Z-score: {a.zScore.toFixed(1)} · {new Date(a.tx.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Saving tips + Budget recs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title={t('savingTips')} action={<PiggyBank className="h-5 w-5 text-emerald-500" />}>
          <ul className="space-y-2.5">
            {tips.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
                <PiggyBank className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <p className="text-sm text-slate-700 dark:text-slate-300">{t}</p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title={t('smartBudgetRecs')} action={<Wand2 className="h-5 w-5 text-violet-500" />}>
          {recs.length === 0 ? (
            <EmptyState icon={<Wand2 className="h-6 w-6" />} title={t('addTransactionsRecs')} />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(150, recs.length * 40)}>
              <BarChart data={recs.slice(0, 6)} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="currentAvg" name="Current avg" fill="#94a3b8" radius={[0, 6, 6, 0]} />
                <Bar dataKey="recommended" name="Recommended" fill="#2d9a6c" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Chatbot */}
      <SectionCard title={t('aiChatbot')} action={<Bot className="h-5 w-5 text-brand-500" />}>
        <div className="mb-3 flex flex-wrap gap-2">
          {quickQuestions.map((q) => (
            <button key={q} onClick={() => { setInput(t(q)); }} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
              {t(q)}
            </button>
          ))}
        </div>
        <div className="mb-3 max-h-80 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-4 dark:bg-white/5">
          {chat.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </span>
              <div className={`max-w-[75%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 shadow-sm dark:bg-[#1a2520] dark:text-slate-200'}`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={chatEnd} />
        </div>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder={t('askPlaceholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
          />
          <button onClick={sendChat} className="btn-primary shrink-0">
            <Send className="h-4 w-4" /> {t('send')}
          </button>
        </div>
      </SectionCard>
    </div>
  )
}
