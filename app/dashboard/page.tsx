import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { getTransactionsByYear } from './actions'
import { checkNeedsOnboarding } from '@/app/(onboarding)/onboarding/actions'

async function fetchDolar() {
    try {
        const res = await fetch('https://dolarapi.com/v1/dolares/bolsa', { next: { revalidate: 300 } })
        if (!res.ok) throw new Error()
        const data = JSON.parse(await res.text())
        return {
            venta: data.venta as number,
            compra: data.compra as number,
            variacion: (data.variacion ?? 0) as number,
        }
    } catch {
        return { venta: 0, compra: 0, variacion: 0 }
    }
}

export default async function DashboardPage() {
    const needsOnboarding = await checkNeedsOnboarding()
    if (needsOnboarding) redirect('/onboarding')

    const year = new Date().getFullYear()
    const [dolar, transactions] = await Promise.all([
        fetchDolar(),
        getTransactionsByYear(year),
    ])

    return (
        <DashboardClient
            dolar={dolar}
            initialYear={year}
            transactions={transactions}
        />
    )
}
