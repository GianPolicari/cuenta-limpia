'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = (formData.get('email') as string)?.trim()
    const password = formData.get('password') as string

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        redirect('/register?error=Ingresá+un+email+válido.')
    }
    if (!password || password.length < 6) {
        redirect('/register?error=La+contraseña+debe+tener+al+menos+6+caracteres.')
    }

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
        redirect('/register?error=No+se+pudo+crear+la+cuenta.+Intentá+de+nuevo.')
    }

    redirect('/dashboard')
}
