'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

// ==================== TRANSACTIONS CRUD ====================

export async function getTransactions(month: number, year: number) {
    const supabase = await createClient()
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
}

export async function addTransaction(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const description = formData.get('description') as string
    const amount = parseFloat(formData.get('amount') as string)
    const category = formData.get('category') as string
    const transaction_type = formData.get('transaction_type') as string
    const transaction_date = formData.get('date') as string
    const card_id = (formData.get('card_id') as string) || null

    const isInstallment = formData.get('isInstallment') === 'true'
    const installmentsCount = parseInt(formData.get('installmentsCount') as string) || 1

    if (!description || !amount || !transaction_type || !transaction_date) {
        return { error: 'Todos los campos son obligatorios' }
    }

    if (isInstallment && transaction_type === 'expense' && installmentsCount > 1) {
        const installmentAmount = amount / installmentsCount;
        const rowsToInsert = [];
        const [year, monthDigit, day] = transaction_date.split('-').map(Number);

        for (let i = 0; i < installmentsCount; i++) {
            const dateObj = new Date(year, monthDigit - 1 + i, day);
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dateObj.getDate()).padStart(2, '0');
            const formattedDate = `${y}-${m}-${d}`;

            rowsToInsert.push({
                amount: installmentAmount,
                transaction_date: formattedDate,
                description: `${description} (Cuota ${i + 1}/${installmentsCount})`,
                category: category || null,
                transaction_type,
                card_id,
            });
        }

        const { error } = await supabase.from('transactions').insert(rowsToInsert);
        if (error) return { error: 'Error al guardar cuotas: ' + error.message }
    } else {
        const { error } = await supabase.from('transactions').insert({
            amount, transaction_date, description,
            category: category || null, transaction_type, card_id,
        });
        if (error) return { error: 'Error al guardar: ' + error.message }
    }
    revalidatePath('/dashboard/ingresos-egresos')
    revalidatePath('/dashboard')
    return { error: null }
}

export async function updateTransaction(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const description = formData.get('description') as string
    const amount = parseFloat(formData.get('amount') as string)
    const category = formData.get('category') as string
    const transaction_type = formData.get('transaction_type') as string
    const transaction_date = formData.get('date') as string
    const card_id = (formData.get('card_id') as string) || null

    const { error } = await supabase.from('transactions').update({
        amount, transaction_date, description,
        category: category || null, transaction_type, card_id,
    }).eq('id', id)

    if (error) return { error: 'Error al actualizar: ' + error.message }
    revalidatePath('/dashboard/ingresos-egresos')
    revalidatePath('/dashboard')
    return { error: null }
}

export async function deleteTransaction(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) return { error: 'Error al eliminar: ' + error.message }

    revalidatePath('/dashboard/ingresos-egresos')
    revalidatePath('/dashboard')
    return { error: null }
}

// ==================== CATEGORIES (from Phase 2) ====================

export async function getCategoriesByType(type: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('custom_categories')
        .select('id, name')
        .eq('type', type)
        .order('name')
    if (error) return []
    return data ?? []
}

// ==================== CARDS (for linking) ====================

export async function getCards() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('cards').select('id, name, card_type, color').order('name')
    if (error) return []
    return data ?? []
}
