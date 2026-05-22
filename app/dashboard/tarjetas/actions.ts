'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createCard(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const name = (formData.get('name') as string)?.trim()
    const card_type = (formData.get('card_type') as string)?.trim()
    const color = ((formData.get('color') as string) || '').trim() || null

    if (!name || !card_type) {
        return { error: 'Completá el nombre y el tipo de tarjeta.' }
    }

    const { data, error } = await supabase.from('cards').insert({
        name,
        card_type,
        color,
        user_id: user.id,
    }).select('id, name, card_type, color').single()

    if (error) return { error: error.message, card: null }

    revalidatePath('/dashboard/tarjetas')
    return { error: null, card: data }
}

export async function deleteCard(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/tarjetas')
    return { error: null }
}
