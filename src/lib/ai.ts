import type { Transaction, Budget } from './supabase'
import { monthKey, lastNMonthsKeys } from './format'

// ---------- AI / Analytics engine (client-side heuristics) ----------

export function monthlyStats(txs: Transaction[], month: string) {
  const filtered = txs.filter((t) => monthKey(new Date(t.transaction_date)) === month)
  const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return { income, expense, balance: income - expense, count: filtered.length }
}

export function categoryBreakdown(txs: Transaction[], type: 'income' | 'expense', month?: string) {
  let filtered = txs.filter((t) => t.type === type)
  if (month) filtered = filtered.filter((t) => monthKey(new Date(t.transaction_date)) === month)
  const map = new Map<string, number>()
  for (const t of filtered) map.set(t.category_name, (map.get(t.category_name) ?? 0) + t.amount)
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}



// AI Spending Prediction — linear regression on monthly expense history
export function predictNextMonthExpense(txs: Transaction[]): number {
  const months = lastNMonthsKeys(6)
  const data = months.map((m) => monthlyStats(txs, m).expense)
  const n = data.length
  if (n === 0) return 0
  const xs = data.map((_, i) => i)
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = data.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (data[i] - meanY)
    den += (xs[i] - meanX) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  const intercept = meanY - slope * meanX
  const next = intercept + slope * n
  return Math.max(0, Math.round(next))
}

// Expense Forecasting — average of last 3 months weighted by trend
export function forecastMonthlyExpenses(txs: Transaction[]): { month: string; predicted: number }[] {
  const months = lastNMonthsKeys(3)
  const recent = months.map((m) => monthlyStats(txs, m).expense)
  const avg = recent.reduce((a, b) => a + b, 0) / (recent.length || 1)
  const predicted = predictNextMonthExpense(txs)
  const future: { month: string; predicted: number }[] = []
  const last = months[months.length - 1]
  const [y, m] = last.split('-').map(Number)
  for (let i = 1; i <= 3; i++) {
    const d = new Date(y, m - 1 + i, 1)
    future.push({ month: monthKey(d), predicted: Math.round(avg * 0.6 + predicted * 0.4) })
  }
  return future
}

// Anomaly Detection — transactions significantly above user's average for that category
export function detectAnomalies(txs: Transaction[]): { tx: Transaction; zScore: number; avg: number }[] {
  const expenses = txs.filter((t) => t.type === 'expense')
  const byCat = new Map<string, Transaction[]>()
  for (const t of expenses) {
    const arr = byCat.get(t.category_name) ?? []
    arr.push(t)
    byCat.set(t.category_name, arr)
  }
  const anomalies: { tx: Transaction; zScore: number; avg: number }[] = []
  for (const [, arr] of byCat) {
    if (arr.length < 3) continue
    const amounts = arr.map((a) => a.amount)
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const variance = amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length
    const std = Math.sqrt(variance)
    if (std === 0) continue
    for (const t of arr) {
      const z = (t.amount - mean) / std
      if (z > 2) anomalies.push({ tx: t, zScore: z, avg: mean })
    }
  }
  return anomalies.sort((a, b) => b.zScore - a.zScore)
}

// Spending Behavior Analysis
export function behaviorAnalysis(txs: Transaction[]): string[] {
  const insights: string[] = []
  const months = lastNMonthsKeys(2)
  if (months.length < 2) return insights
  const thisMonth = months[1]
  const lastMonth = months[0]
  const thisStats = monthlyStats(txs, thisMonth)
  const lastStats = monthlyStats(txs, lastMonth)

  // overall expense change
  if (lastStats.expense > 0) {
    const change = ((thisStats.expense - lastStats.expense) / lastStats.expense) * 100
    if (Math.abs(change) > 5) {
      insights.push(
        change > 0
          ? `Your expenses increased by ${change.toFixed(0)}% compared to last month.`
          : `Your expenses decreased by ${Math.abs(change).toFixed(0)}% compared to last month.`
      )
    }
  }
  // top category
  const cats = categoryBreakdown(txs, 'expense', thisMonth)
  if (cats.length > 0) {
    insights.push(`${cats[0].name} is your highest spending category this month.`)
  }
  // per-category growth
  const lastCats = new Map(categoryBreakdown(txs, 'expense', lastMonth).map((c) => [c.name, c.value]))
  for (const c of cats.slice(0, 3)) {
    const prev = lastCats.get(c.name) ?? 0
    if (prev > 0) {
      const change = ((c.value - prev) / prev) * 100
      if (change > 15) insights.push(`${c.name} expenses increased by ${change.toFixed(0)}% this month.`)
    }
  }
  return insights
}

// Smart Budget Recommendation — based on average spending per category + savings goal
export function recommendBudgets(txs: Transaction[]): { category: string; recommended: number; currentAvg: number }[] {
  const months = lastNMonthsKeys(3)
  const catAvg = new Map<string, number[]>()
  for (const m of months) {
    const cats = categoryBreakdown(txs, 'expense', m)
    for (const c of cats) {
      const arr = catAvg.get(c.name) ?? []
      arr.push(c.value)
      catAvg.set(c.name, arr)
    }
  }
  const recs: { category: string; recommended: number; currentAvg: number }[] = []
  for (const [cat, vals] of catAvg) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    // recommend 90% of average to encourage slight savings
    recs.push({ category: cat, recommended: Math.round(avg * 0.9), currentAvg: Math.round(avg) })
  }
  return recs.sort((a, b) => b.currentAvg - a.currentAvg)
}

// Personalized Saving Tips
export function savingTips(txs: Transaction[]): string[] {
  const tips: string[] = []
  const cats = categoryBreakdown(txs, 'expense')
  const totalExpense = cats.reduce((s, c) => s + c.value, 0)
  if (totalExpense === 0) return ['Add some transactions to receive personalized saving tips.']

  // highest category tip
  if (cats.length > 0) {
    const top = cats[0]
    const pct = ((top.value / totalExpense) * 100).toFixed(0)
    tips.push(`You spend ${pct}% of your budget on ${top.name}. Try cutting it by 10% to save $${(top.value * 0.1).toFixed(0)} this month.`)
  }
  // dining/food
  const food = cats.find((c) => /food|dining|restaurant|coffee/i.test(c.name))
  if (food && food.value > 200) {
    tips.push(`Cooking at home 3 more days a week could save you about $${(food.value * 0.25).toFixed(0)} on ${food.name}.`)
  }
  // shopping
  const shopping = cats.find((c) => /shop/i.test(c.name))
  if (shopping && shopping.value > 150) {
    tips.push(`Consider a 48-hour rule for ${shopping.name} purchases — you could save $${(shopping.value * 0.2).toFixed(0)}.`)
  }
  // subscriptions
  const subs = cats.find((c) => /sub|entertain|stream/i.test(c.name))
  if (subs) {
    tips.push(`Review your ${subs.name} subscriptions — cancelling unused ones could save $${(subs.value * 0.3).toFixed(0)}/month.`)
  }
  if (tips.length < 2) tips.push('Set a monthly savings goal of at least 10% of your income to build a healthy buffer.')
  return tips
}

// Automatic Expense Classification (NLP-lite keyword matching)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ['starbucks', 'mcdonald', 'restaurant', 'cafe', 'coffee', 'grocery', 'supermarket', 'pizza', 'burger', 'food', 'kitchen', 'bakery', 'kfc', 'subway', 'doordash', 'uber eats', 'grubhub'],
  Transportation: ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'petrol', 'bus', 'train', 'metro', 'parking', 'car', 'transit', 'shell', 'bp'],
  Shopping: ['amazon', 'ebay', 'mall', 'store', 'shop', 'clothing', 'shoes', 'target', 'walmart', 'ikea', 'purchase'],
  Entertainment: ['netflix', 'spotify', 'cinema', 'movie', 'theater', 'concert', 'game', 'steam', 'playstation', 'xbox', 'disney'],
  Healthcare: ['pharmacy', 'doctor', 'hospital', 'dental', 'clinic', 'medicine', 'cvs', 'walgreens', 'health'],
  Education: ['tuition', 'course', 'book', 'udemy', 'coursera', 'school', 'university', 'training', 'library'],
  Bills: ['electric', 'water', 'gas bill', 'internet', 'phone', 'rent', 'mortgage', 'insurance', 'utility'],
  Salary: ['salary', 'payroll', 'wage', 'paycheck'],
  Freelance: ['freelance', 'client', 'invoice', 'contract', 'gig'],
  Business: ['business', 'sale', 'revenue', 'customer'],
}

export function autoClassify(description: string): string | null {
  const lower = description.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return cat
  }
  return null
}

// AI Monthly Financial Summary
export function monthlySummary(txs: Transaction[], budgets: Budget[], month: string): string {
  const thisStats = monthlyStats(txs, month)
  const months = lastNMonthsKeys(2)
  const lastMonth = months[0]
  const lastStats = monthlyStats(txs, lastMonth)

  const parts: string[] = []
  if (lastStats.expense > 0) {
    const change = ((thisStats.expense - lastStats.expense) / lastStats.expense) * 100
    if (change < 0) parts.push(`Your expenses decreased by ${Math.abs(change).toFixed(0)}% compared to last month.`)
    else parts.push(`Your expenses increased by ${change.toFixed(0)}% compared to last month.`)
  }
  const cats = categoryBreakdown(txs, 'expense', month)
  if (cats.length >= 2) {
    parts.push(`Most of your spending was on ${cats[0].name} and ${cats[1].name}.`)
  } else if (cats.length === 1) {
    parts.push(`Most of your spending was on ${cats[0].name}.`)
  }
  // budget adherence
  const monthBudgets = budgets.filter((b) => monthKey(new Date(b.period_month)) === month)
  if (monthBudgets.length > 0) {
    let under = 0
    for (const b of monthBudgets) {
      const spent = txs
        .filter((t) => t.type === 'expense' && t.category_name === b.category_name && monthKey(new Date(t.transaction_date)) === month)
        .reduce((s, t) => s + t.amount, 0)
      if (spent <= b.limit_amount) under++
    }
    if (under === monthBudgets.length) parts.push('You stayed within your budget across all categories.')
    else parts.push(`You exceeded your budget in ${monthBudgets.length - under} of ${monthBudgets.length} categories.`)
  }
  if (thisStats.balance > 0) {
    const diff = thisStats.balance - lastStats.balance
    if (diff > 0) parts.push(`You saved more than last month.`)
    else if (diff < 0) parts.push(`You saved less than last month.`)
  }
  return parts.join(' ')
}

// AI Chatbot — answers natural-language financial questions
export function answerChatbot(question: string, txs: Transaction[], budgets: Budget[], currency: string): string {
  const q = question.toLowerCase()
  const thisMonth = monthKey(new Date())
  const months = lastNMonthsKeys(2)
  const lastMonth = months[0]
  const sym = currency === 'USD' ? '$' : ''
  const fmt = (n: number) => `${sym}${n.toFixed(2)}`

  if (/highest|top|most spent|biggest/.test(q) && /categor|spend|expense/.test(q)) {
    const cats = categoryBreakdown(txs, 'expense', thisMonth)
    if (cats.length === 0) return 'You have no expenses recorded this month yet.'
    return `Your highest spending category this month is ${cats[0].name} at ${fmt(cats[0].value)}.`
  }
  if (/how much.*spend|spent.*this month|spending/.test(q) && !/last month/.test(q)) {
    const s = monthlyStats(txs, thisMonth)
    return `You spent ${fmt(s.expense)} this month and earned ${fmt(s.income)}, leaving a balance of ${fmt(s.balance)}.`
  }
  if (/compare|last month|vs|versus|previous/.test(q)) {
    const t = monthlyStats(txs, thisMonth)
    const l = monthlyStats(txs, lastMonth)
    const expChange = l.expense > 0 ? ((t.expense - l.expense) / l.expense) * 100 : 0
    return `This month: ${fmt(t.expense)} spent, ${fmt(t.income)} earned. Last month: ${fmt(l.expense)} spent, ${fmt(l.income)} earned. Your expenses changed ${expChange >= 0 ? '+' : ''}${expChange.toFixed(0)}%.`
  }
  if (/save|saving|tip/.test(q)) {
    const tips = savingTips(txs)
    return tips.join(' ')
  }
  if (/income|earn|make/.test(q)) {
    const s = monthlyStats(txs, thisMonth)
    return `You earned ${fmt(s.income)} this month.`
  }
  if (/budget/.test(q)) {
    const monthBudgets = budgets.filter((b) => monthKey(new Date(b.period_month)) === thisMonth)
    if (monthBudgets.length === 0) return "You haven't set a budget for this month yet."
    const lines = monthBudgets.map((b) => {
      const spent = txs
        .filter((t) => t.type === 'expense' && t.category_name === b.category_name && monthKey(new Date(t.transaction_date)) === thisMonth)
        .reduce((s, t) => s + t.amount, 0)
      const remaining = b.limit_amount - spent
      return `${b.category_name}: ${fmt(spent)}/${fmt(b.limit_amount)} (${remaining >= 0 ? `${fmt(remaining)} left` : `${fmt(Math.abs(remaining))} over`})`
    })
    return `Your budget status:\n${lines.join('\n')}`
  }
  if (/anomal|unusual|suspicious/.test(q)) {
    const anomalies = detectAnomalies(txs)
    if (anomalies.length === 0) return 'No unusual spending detected in your recent transactions.'
    return `I found ${anomalies.length} unusual transaction(s). The largest is ${fmt(anomalies[0].tx.amount)} on ${anomalies[0].tx.category_name}, which is well above your average of ${fmt(anomalies[0].avg)}.`
  }
  return "I can help with: how much you spent this month, your highest spending category, comparing months, saving tips, budget status, or anomaly detection. Try asking one of those!"
}
