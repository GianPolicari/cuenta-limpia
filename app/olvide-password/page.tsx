'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function OlvidePasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            toast.error('Por favor, ingresá un correo electrónico válido')
            return
        }

        setIsLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) {
                toast.error(error.message)
            } else {
                toast.success('✅ Si el correo existe, recibirás un enlace para recuperar tu cuenta.')
                setEmail('')
            }
        } catch (err: any) {
            toast.error(err.message || 'Ocurrió un error al intentar enviar el correo.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 dark:bg-slate-950">
            {/* Background gradient effect */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
            </div>

            <Card className="relative w-full max-w-md border-slate-200 bg-white/80 shadow-2xl shadow-emerald-500/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
                        <DollarSign className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Recuperar Contraseña
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Ingresá tu email y te enviaremos un enlace para recuperar tu acceso.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Email
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="tu@email.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                className="border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500"
                            />
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/40"
                            >
                                {isLoading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
                            </Button>
                        </div>
                    </form>

                    <div className="text-center text-sm">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 font-medium text-slate-500 transition-colors hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver al login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
