import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'

// ---------- DATA FETCHERS ----------

async function fetchDolarBlue() {
    try {
        const res = await fetch('https://dolarapi.com/v1/dolares/bolsa', { next: { revalidate: 300 } })
        if (!res.ok) throw new Error('Dolar API error')
        const text = await res.text()
        if (!text) throw new Error('Empty response')
        const data = JSON.parse(text)
        return { venta: data.venta as number, compra: data.compra as number, variacion: (data.variacion ?? 0) as number }
    } catch {
        return { venta: 0, compra: 0, variacion: 0 }
    }
}

async function fetchDolarMep() {
    try {
        const res = await fetch('https://dolarapi.com/v1/dolares/bolsa', { next: { revalidate: 300 } })
        if (!res.ok) throw new Error('Dolar MEP API error')
        const text = await res.text()
        if (!text) throw new Error('Empty response')
        const data = JSON.parse(text)
        return (data.venta as number) ?? 1400
    } catch (error) {
        console.error('MEP Fetch fallback (Server):', error)
        return 1400
    }
}

async function fetchAllTransactions(supabase: Awaited<ReturnType<typeof createClient>>) {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('transaction_date', { ascending: true })
        if (error) throw error
        return data ?? []
    } catch {
        return []
    }
}

// Helper logic moved to client

// ---------- PAGE ----------

export default async function DashboardPage() {
    const supabase = await createClient()
    const [dolar, dolarMep, allTransactions] = await Promise.all([
        fetchDolarBlue(),
        fetchDolarMep(),
        fetchAllTransactions(supabase),
    ])

    return (
        <DashboardClient
            dolar={dolar}
            dolarMep={dolarMep}
            transactions={allTransactions}
        />
    )
}
