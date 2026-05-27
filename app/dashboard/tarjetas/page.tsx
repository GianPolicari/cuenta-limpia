import { createClient } from '@/utils/supabase/server'
import TarjetasClient from './TarjetasClient'

export default async function TarjetasPage() {
    const supabase = await createClient()

    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const mm = String(month + 1).padStart(2, '0')
    const lastDay = new Date(year, month + 1, 0).getDate()
    const startOfMonth = `${year}-${mm}-01`
    const endOfMonth = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`

    const [cardsRes, cuotasRes] = await Promise.all([
        supabase.from('cards').select('id, name, card_type, color').order('name'),
        supabase
            .from('transactions')
            .select('id, description, amount, transaction_date, card_id, cuota_actual, total_cuotas')
            .not('total_cuotas', 'is', null)
            .gte('transaction_date', startOfMonth)
            .lte('transaction_date', endOfMonth)
            .order('transaction_date', { ascending: true }),
    ])

    return (
        <TarjetasClient
            initialCards={cardsRes.data ?? []}
            cuotas={cuotasRes.data ?? []}
        />
    )
}
