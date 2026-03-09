'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newPassword || newPassword.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres.')
            return
        }

        setIsLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            })

            if (error) {
                toast.error(error.message)
            } else {
                toast.success('✅ Contraseña actualizada correctamente')
                router.push('/dashboard')
            }
        } catch (err: any) {
            toast.error(err.message || 'Ocurrió un error al actualizar la contraseña.')
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
                        <ShieldCheck className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Nueva Contraseña
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Ingresá una nueva contraseña segura para tu cuenta.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="newPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Nueva Contraseña
                            </label>
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={6}
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
                                {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
