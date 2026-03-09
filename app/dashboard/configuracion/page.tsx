import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/login/actions'
import { getCards, getCategories } from './actions'
import SettingsClient from './SettingsClient'

export default async function ConfiguracionPage() {
    const supabase = await createClient()
    let email = ''
    let createdAt = ''

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            email = user.email ?? ''
            createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
        }
    } catch { /* */ }

    const [cardsRes, categoriesRes] = await Promise.all([
        getCards(),
        getCategories(),
    ])

    return (
        <SettingsClient
            email={email}
            createdAt={createdAt}
            signOut={signOut}
            initialCards={cardsRes.data ?? []}
            initialCategories={categoriesRes.data ?? []}
        />
    )
}
