import { getSavingsGoals } from './actions'
import MetasClient from './MetasClient'

export default async function MetasPage() {
    const goalsRes = await getSavingsGoals()
    return <MetasClient initialGoals={goalsRes.data ?? []} />
}
