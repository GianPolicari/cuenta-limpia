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
    const name = formData.get('name') as string
    const card_type = formData.get('card_type') as string
    const color = formData.get('color') as string | null

    if (!name || !card_type) return { error: 'Nombre y tipo son obligatorios.' }

    const { error } = await supabase.from('cards').insert({ name, card_type, color })
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    return { error: null }
}

export async function updateCard(id: string, formData: FormData) {
    const supabase = await createClient()
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
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    return { error: null }
}

// ==================== CUSTOM CATEGORIES ====================

export async function getCategories() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('custom_categories').select('*').order('name')
    if (error) return { data: null, error: error.message }
    return { data, error: null }
}

export async function addCategory(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const type = formData.get('type') as string

    if (!name || !type) return { error: 'Nombre y tipo son obligatorios.' }

    const { error } = await supabase.from('custom_categories').insert({ name, type })
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    return { error: null }
}

export async function updateCategory(id: string, formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const type = formData.get('type') as string

    const { error } = await supabase.from('custom_categories').update({ name, type }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    return { error: null }
}

export async function deleteCategory(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('custom_categories').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/configuracion')
    return { error: null }
}


