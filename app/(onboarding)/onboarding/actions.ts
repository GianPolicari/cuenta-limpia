'use server'

import { createClient } from '@/utils/supabase/server'

export async function checkNeedsOnboarding(): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
    return (count ?? 0) === 0
}
