'use server'

import { createClient } from '@/utils/supabase/server'

export async function getTransactionsByYear(year: number) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('transactions')
        .select('id, amount, category, transaction_type, transaction_date')
        .gte('transaction_date', `${year}-01-01`)
        .lte('transaction_date', `${year}-12-31`)
        .order('transaction_date', { ascending: true })
    if (error) return []
    return data ?? []
}
