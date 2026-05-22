import IngresosEgresosClient from './IngresosEgresosClient'
import { getTransactions, getCategoriesByType, getCards } from './actions'
import { seedDefaultCategories } from '@/app/dashboard/configuracion/actions'

export default async function IngresosEgresosPage() {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()

    await seedDefaultCategories()

    const [txRes, expenseCats, incomeCats, cards] = await Promise.all([
        getTransactions(month, year),
        getCategoriesByType('expense'),
        getCategoriesByType('income'),
        getCards(),
    ])

    return (
        <IngresosEgresosClient
            initialTransactions={txRes.data ?? []}
            initialMonth={month}
            initialYear={year}
            expenseCategories={expenseCats}
            incomeCategories={incomeCats}
            initialCards={cards}
        />
    )
}
