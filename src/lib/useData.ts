import { useCallback, useEffect, useState } from 'react'
import { supabase, type Transaction, type Category, type Budget } from './supabase'
import { useAuth } from '../context/AuthContext'

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'Food', type: 'expense', icon: 'UtensilsCrossed', color: '#f97316', is_default: true },
  { name: 'Transportation', type: 'expense', icon: 'Car', color: '#3b82f6', is_default: true },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#ec4899', is_default: true },
  { name: 'Entertainment', type: 'expense', icon: 'Clapperboard', color: '#a855f7', is_default: true },
  { name: 'Healthcare', type: 'expense', icon: 'HeartPulse', color: '#ef4444', is_default: true },
  { name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#14b8a6', is_default: true },
  { name: 'Bills', type: 'expense', icon: 'Receipt', color: '#64748b', is_default: true },
  { name: 'Salary', type: 'income', icon: 'Wallet', color: '#2d9a6c', is_default: true },
  { name: 'Freelance', type: 'income', icon: 'Laptop', color: '#0ea5e9', is_default: true },
  { name: 'Business', type: 'income', icon: 'Briefcase', color: '#8b5cf6', is_default: true },
]

export function useData() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  const ensureDefaultCategories = useCallback(async (uid: string) => {
    const { data: existing } = await supabase.from('categories').select('*').eq('user_id', uid)
    if (existing && existing.length > 0) return existing as Category[]
    const rows = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: uid }))
    const { data } = await supabase.from('categories').insert(rows).select('*')
    return (data ?? []) as Category[]
  }, [])

  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const cats = await ensureDefaultCategories(user.id)
    const [txRes, bgRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).order('transaction_date', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', user.id).order('period_month', { ascending: false }),
    ])
    setCategories(cats)
    setTransactions((txRes.data ?? []) as Transaction[])
    setBudgets((bgRes.data ?? []) as Budget[])
    setLoading(false)
  }, [user, ensureDefaultCategories])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // ---- Transactions ----
  async function addTransaction(tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (!user) return
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...tx, user_id: user.id })
      .select('*')
      .maybeSingle()
    if (!error && data) setTransactions((prev) => [data as Transaction, ...prev])
    return { error }
  }
  async function updateTransaction(id: string, updates: Partial<Transaction>) {
    const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select('*').maybeSingle()
    if (!error && data) setTransactions((prev) => prev.map((t) => (t.id === id ? (data as Transaction) : t)))
    return { error }
  }
  async function deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) setTransactions((prev) => prev.filter((t) => t.id !== id))
    return { error }
  }

  // ---- Categories ----
  async function addCategory(cat: Omit<Category, 'id' | 'user_id' | 'created_at' | 'is_default'>) {
    if (!user) return
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...cat, user_id: user.id, is_default: false })
      .select('*')
      .maybeSingle()
    if (!error && data) setCategories((prev) => [...prev, data as Category])
    return { error }
  }
  async function deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (!error) setCategories((prev) => prev.filter((c) => c.id !== id))
    return { error }
  }

  // ---- Budgets ----
  async function addBudget(b: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (!user) return
    const { data, error } = await supabase
      .from('budgets')
      .insert({ ...b, user_id: user.id })
      .select('*')
      .maybeSingle()
    if (!error && data) setBudgets((prev) => [...prev, data as Budget])
    return { error }
  }
  async function updateBudget(id: string, updates: Partial<Budget>) {
    const { data, error } = await supabase.from('budgets').update(updates).eq('id', id).select('*').maybeSingle()
    if (!error && data) setBudgets((prev) => prev.map((b) => (b.id === id ? (data as Budget) : b)))
    return { error }
  }
  async function deleteBudget(id: string) {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (!error) setBudgets((prev) => prev.filter((b) => b.id !== id))
    return { error }
  }

  return {
    transactions,
    categories,
    budgets,
    loading,
    reload: loadAll,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory,
    addBudget,
    updateBudget,
    deleteBudget,
  }
}
