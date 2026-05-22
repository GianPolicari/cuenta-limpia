import IngresosEgresosClient from './IngresosEgresosClient'
import { getTransactions, getCategoriesByType, getCards } from './actions'
import { seedDefaultCategories, getBudgets } from '@/app/dashboard/configuracion/actions'

export default async function IngresosEgresosPage() {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()

    await seedDefaultCategories()

    const [txRes, expenseCats, incomeCats, cards, budgetsRes] = await Promise.all([
        getTransactions(month, year),
        getCategoriesByType('expense'),
        getCategoriesByType('income'),
        getCards(),
        getBudgets(),
    ])

    return (
        <IngresosEgresosClient
            initialTransactions={txRes.data ?? []}
            initialMonth={month}
            initialYear={year}
            expenseCategories={expenseCats}
            incomeCategories={incomeCats}
            initialCards={cards}
            initialBudgets={budgetsRes.data ?? []}
        />
    )
}
