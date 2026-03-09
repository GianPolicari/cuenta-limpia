import IngresosEgresosClient from './IngresosEgresosClient'
import { getTransactions, getCategoriesByType, getCards } from './actions'

export default async function IngresosEgresosPage() {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()

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
            cards={cards}
        />
    )
}
