import { createClient } from '@/utils/supabase/server'
import TarjetasClient from './TarjetasClient'

export default async function TarjetasPage() {
    const supabase = await createClient()

    const today = new Date()
    const startOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

    const [cardsRes, cuotasRes] = await Promise.all([
        supabase.from('cards').select('id, name, card_type, color').order('name'),
        supabase
            .from('transactions')
            .select('id, description, amount, transaction_date, card_id, cuota_actual, total_cuotas')
            .not('total_cuotas', 'is', null)
            .gte('transaction_date', startOfMonth)
            .order('transaction_date', { ascending: true }),
    ])

    return (
        <TarjetasClient
            initialCards={cardsRes.data ?? []}
            cuotas={cuotasRes.data ?? []}
        />
    )
}
