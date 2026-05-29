import IngresosEgresosClient from './IngresosEgresosClient'
import { getTransactions, getCategoriesByType, getCards } from './actions'
import { seedDefaultCategories, getBudgets, getRecurringTransactions, getRecurringApplied } from '@/app/dashboard/configuracion/actions'

export default async function IngresosEgresosPage() {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    await seedDefaultCategories()

    const [txRes, expenseCats, incomeCats, cards, budgetsRes, recurringRes, appliedRes] = await Promise.all([
        getTransactions(month, year),
        getCategoriesByType('expense'),
        getCategoriesByType('income'),
        getCards(),
        getBudgets(),
        getRecurringTransactions(),
        getRecurringApplied(month, year),
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
            initialRecurring={(recurringRes.data ?? []) as unknown as Parameters<typeof IngresosEgresosClient>[0]['initialRecurring']}
            initialRecurringApplied={appliedRes.data ?? []}
        />
    )
}
