'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
        } catch {
            toast.error('Ocurrió un error al intentar enviar el correo.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
            {/* Ambient emerald glow */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
            </div>

            <Card className="cl-animate-scale relative w-full max-w-md backdrop-blur-xl bg-slate-900/80 border-slate-800 text-white">
                <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-brand">
                        <DollarSign className="h-7 w-7 text-white" aria-hidden />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">
                        Recuperar Contraseña
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Ingresá tu email y te enviaremos un enlace para recuperar tu acceso.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="tu@email.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="cl-press w-full font-semibold shadow-brand"
                            >
                                {isLoading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
                            </Button>
                        </div>
                    </form>

                    <div className="text-center text-sm">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 font-medium text-slate-400 transition-colors hover:text-primary"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden />
                            Volver al login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
