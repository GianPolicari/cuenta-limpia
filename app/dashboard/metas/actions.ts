'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSavingsGoals() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .order('created_at', { ascending: true })
    if (error) return { data: null, error: error.message }
    return { data, error: null }
}

export async function addSavingsGoal(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado', goal: null }

    const name = (formData.get('name') as string)?.trim()
    const target_amount = parseFloat(formData.get('target_amount') as string)
    const deadlineRaw = (formData.get('deadline') as string)?.trim()
    const deadline = deadlineRaw || null

    if (!name) return { error: 'El nombre es requerido.', goal: null }
    if (isNaN(target_amount) || target_amount <= 0) return { error: 'El monto objetivo debe ser mayor a 0.', goal: null }

    const { data, error } = await supabase
        .from('savings_goals')
        .insert({ name, target_amount, deadline, user_id: user.id })
        .select('*')
        .single()

    if (error) return { error: error.message, goal: null }

    revalidatePath('/dashboard/metas')
    return { error: null, goal: data }
}

export async function updateSavingsGoal(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const name = (formData.get('name') as string)?.trim()
    const target_amount = parseFloat(formData.get('target_amount') as string)
    const deadlineRaw = (formData.get('deadline') as string)?.trim()
    const deadline = deadlineRaw || null

    if (!name) return { error: 'El nombre es requerido.' }
    if (isNaN(target_amount) || target_amount <= 0) return { error: 'El monto objetivo debe ser mayor a 0.' }

    const { error } = await supabase
        .from('savings_goals')
        .update({ name, target_amount, deadline })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/metas')
    return { error: null }
}

export async function deleteSavingsGoal(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/metas')
    return { error: null }
}

export async function contributeToGoal(id: string, amount: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    if (isNaN(amount) || amount <= 0) return { error: 'El monto debe ser mayor a 0.' }

    const { data: goal, error: fetchError } = await supabase
        .from('savings_goals')
        .select('current_amount')
        .eq('id', id)
        .single()

    if (fetchError || !goal) return { error: fetchError?.message ?? 'Meta no encontrada.' }

    const newAmount = goal.current_amount + amount

    const { error } = await supabase
        .from('savings_goals')
        .update({ current_amount: newAmount })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/metas')
    return { error: null }
}
