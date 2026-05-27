import { redirect } from 'next/navigation'
import { checkNeedsOnboarding } from './actions'
import { seedDefaultCategories } from '@/app/dashboard/configuracion/actions'
import { getCategoriesByType } from '@/app/dashboard/ingresos-egresos/actions'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
    const needsOnboarding = await checkNeedsOnboarding()
    if (!needsOnboarding) redirect('/dashboard')

    await seedDefaultCategories()

    const [expenseCategories, incomeCategories] = await Promise.all([
        getCategoriesByType('expense'),
        getCategoriesByType('income'),
    ])

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
            {/* Ambient violet glow */}
            <div aria-hidden="true"className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
            </div>

            <div className="relative w-full max-w-md">
                <OnboardingClient
                    expenseCategories={expenseCategories}
                    incomeCategories={incomeCategories}
                />
            </div>
        </div>
    )
}
