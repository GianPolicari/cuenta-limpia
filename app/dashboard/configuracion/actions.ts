'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ==================== CARDS ====================

export async function getCards() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('cards').select('*').order('name')
    if (error) return { data: null, error: error.message }
    return { data, error: null }
}

export async function addCard(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const name = formData.get('name') as string
    const card_type = formData.get('card_type') as string
    const color = formData.get('color') as string | null

    if (!name || !card_type) return { error: 'Nombre y tipo son obligatorios.' }

    const { error } = await supabase.from('cards').insert({ name, card_type, color, user_id: user.id })
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    return { error: null }
}

export async function updateCard(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const name = formData.get('name') as string
    const card_type = formData.get('card_type') as string
    const color = formData.get('color') as string | null

    const { error } = await supabase.from('cards').update({ name, card_type, color }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    return { error: null }
}

export async function deleteCard(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    return { error: null }
}

// ==================== CUSTOM CATEGORIES ====================

const DEFAULT_CATEGORIES = [
    { name: 'Alimentación', type: 'expense' },
    { name: 'Transporte', type: 'expense' },
    { name: 'Servicios', type: 'expense' },
    { name: 'Salud', type: 'expense' },
    { name: 'Entretenimiento', type: 'expense' },
    { name: 'Indumentaria', type: 'expense' },
    { name: 'Educación', type: 'expense' },
    { name: 'Restaurantes', type: 'expense' },
    { name: 'Sueldo', type: 'income' },
    { name: 'Freelance', type: 'income' },
    { name: 'Otros ingresos', type: 'income' },
]

export async function seedDefaultCategories() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { count } = await supabase
        .from('custom_categories')
        .select('*', { count: 'exact', head: true })
    if ((count ?? 0) > 0) return
    await supabase
        .from('custom_categories')
        .insert(DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: user.id })))
}

export async function getCategories() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('custom_categories').select('*').order('name')
    if (error) return { data: null, error: error.message }
    return { data, error: null }
}

export async function addCategory(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const name = formData.get('name') as string
    const type = formData.get('type') as string

    if (!name || !type) return { error: 'Nombre y tipo son obligatorios.' }

    const { error } = await supabase.from('custom_categories').insert({ name, type, user_id: user.id })
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    return { error: null }
}

export async function updateCategory(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const name = formData.get('name') as string
    const type = formData.get('type') as string

    const { error } = await supabase.from('custom_categories').update({ name, type }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    return { error: null }
}

export async function deleteCategory(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase.from('custom_categories').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    return { error: null }
}

// ==================== BUDGETS ====================

export async function getBudgets() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('category_name')
    if (error) return { data: null, error: error.message }
    return { data, error: null }
}

export async function upsertBudget(categoryName: string, amount: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }
    if (isNaN(amount) || amount < 0) return { error: 'El monto debe ser un número válido.' }

    const { error } = await supabase
        .from('budgets')
        .upsert(
            { category_name: categoryName, monthly_amount: amount, user_id: user.id },
            { onConflict: 'user_id,category_name' }
        )
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    revalidatePath('/dashboard/ingresos-egresos')
    return { error: null }
}

export async function deleteBudget(categoryName: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('category_name', categoryName)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    revalidatePath('/dashboard/ingresos-egresos')
    return { error: null }
}

// ==================== RECURRING TRANSACTIONS ====================

export async function getRecurringTransactions() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*, cards(name)')
        .order('description')
    if (error) return { data: null, error: error.message }
    return { data, error: null }
}

export async function addRecurring(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const description = formData.get('description') as string
    const amount = Number(formData.get('amount'))
    const transaction_type = formData.get('transaction_type') as string
    const category = (formData.get('category') as string) || null
    const card_id = (formData.get('card_id') as string) || null
    const day_of_month = Number(formData.get('day_of_month'))
    const is_active = formData.get('is_active') === 'true'

    if (!description || !transaction_type) {
        return { error: 'Completá todos los campos obligatorios.' }
    }
    if (isNaN(amount) || amount <= 0) return { error: 'El monto debe ser mayor a 0.' }
    if (isNaN(day_of_month) || day_of_month < 1 || day_of_month > 31) {
        return { error: 'El día del mes debe estar entre 1 y 31.' }
    }

    const { error } = await supabase.from('recurring_transactions').insert({
        description,
        amount,
        transaction_type,
        category,
        card_id: card_id && card_id !== 'none' ? card_id : null,
        day_of_month,
        is_active,
        user_id: user.id,
    })
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    revalidatePath('/dashboard/ingresos-egresos')
    return { error: null }
}

export async function updateRecurring(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const description = formData.get('description') as string
    const amount = Number(formData.get('amount'))
    const transaction_type = formData.get('transaction_type') as string
    const category = (formData.get('category') as string) || null
    const card_id = (formData.get('card_id') as string) || null
    const day_of_month = Number(formData.get('day_of_month'))
    const is_active = formData.get('is_active') === 'true'

    if (isNaN(amount) || amount <= 0) return { error: 'El monto debe ser mayor a 0.' }
    if (isNaN(day_of_month) || day_of_month < 1 || day_of_month > 31) {
        return { error: 'El día del mes debe estar entre 1 y 31.' }
    }

    const { error } = await supabase
        .from('recurring_transactions')
        .update({
            description,
            amount,
            transaction_type,
            category,
            card_id: card_id && card_id !== 'none' ? card_id : null,
            day_of_month,
            is_active,
        })
        .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    revalidatePath('/dashboard/ingresos-egresos')
    return { error: null }
}

export async function deleteRecurring(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    revalidatePath('/dashboard/ingresos-egresos')
    return { error: null }
}

export async function getRecurringApplied(month: number, year: number) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('recurring_applied')
        .select('*')
        .eq('applied_month', month)
        .eq('applied_year', year)
    if (error) return { data: null, error: error.message }
    return { data, error: null }
}

export async function applyRecurring(recurringId: string, month: number, year: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // Obtener la recurrente
    const { data: rec, error: recError } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('id', recurringId)
        .single()
    if (recError || !rec) return { error: recError?.message ?? 'Recurrente no encontrada.' }

    // Calcular la fecha: si el día no existe en ese mes, usar el último día del mes
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const day = Math.min(rec.day_of_month, daysInMonth)
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    const transaction_date = `${year}-${mm}-${dd}`

    // Insertar la transacción
    const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert({
            description: rec.description,
            amount: rec.amount,
            transaction_type: rec.transaction_type,
            category: rec.category,
            card_id: rec.card_id,
            transaction_date,
            user_id: user.id,
        })
        .select('id')
        .single()
    if (txError) return { error: txError.message }

    // Registrar como aplicada
    const { error: appliedError } = await supabase.from('recurring_applied').insert({
        recurring_id: recurringId,
        applied_month: month,
        applied_year: year,
        transaction_id: tx.id,
        user_id: user.id,
    })
    if (appliedError) return { error: appliedError.message }

    revalidatePath('/dashboard/ingresos-egresos')
    revalidatePath('/dashboard')
    return { error: null, transaction_id: tx.id }
}

export async function applyAllPendingRecurring(
    pendingIds: string[],
    month: number,
    year: number
) {
    const results = await Promise.all(pendingIds.map((id) => applyRecurring(id, month, year)))
    const failed = results.filter((r) => r.error)
    if (failed.length > 0) return { error: `${failed.length} recurrente(s) no pudieron aplicarse.` }
    return { error: null }
}

// ==================== ALERT PREFERENCES ====================

export async function getAlertPreferences() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'No autenticado' }

    const { data, error } = await supabase
        .from('user_alert_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
}

export async function upsertAlertPreferences(
    enabled: boolean,
    threshold75: boolean,
    threshold100: boolean
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase
        .from('user_alert_preferences')
        .upsert(
            {
                user_id: user.id,
                email_alerts_enabled: enabled,
                threshold_75: threshold75,
                threshold_100: threshold100,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
        )

    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    return { error: null }
}

// ==================== ALERT OVERRIDES ====================

export async function getAlertOverrides() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'No autenticado' }

    const { data, error } = await supabase
        .from('budget_alert_overrides')
        .select('*')
        .eq('user_id', user.id)

    if (error) return { data: null, error: error.message }
    return { data: data ?? [], error: null }
}

export async function upsertAlertOverride(categoryName: string, alertsEnabled: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase
        .from('budget_alert_overrides')
        .upsert(
            {
                user_id: user.id,
                category_name: categoryName,
                alerts_enabled: alertsEnabled,
            },
            { onConflict: 'user_id,category_name' }
        )

    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    return { error: null }
}

