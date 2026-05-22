import { createClient } from '@/utils/supabase/server'
import TarjetasClient from './TarjetasClient'

export default async function TarjetasPage() {
    const supabase = await createClient()

    const [cardsRes, cuotasRes] = await Promise.all([
        supabase.from('cards').select('id, name, card_type, color').order('name'),
        supabase
            .from('transactions')
            .select('id, description, amount, transaction_date, card_id, cuota_actual, total_cuotas')
            .not('total_cuotas', 'is', null)
            .order('transaction_date', { ascending: false }),
    ])

    return (
        <TarjetasClient
            initialCards={cardsRes.data ?? []}
            cuotas={cuotasRes.data ?? []}
        />
    )
}
