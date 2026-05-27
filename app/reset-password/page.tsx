'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking')
    const router = useRouter()
    const supabase = createClient()

    // Solo permitir el cambio si hay una sesión de recovery válida (link del email)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) {
                setStatus('ready')
            }
        })
        supabase.auth.getSession().then(({ data: { session } }) => {
            setStatus((prev) => (session ? 'ready' : prev === 'ready' ? 'ready' : 'invalid'))
        })
        return () => subscription.unsubscribe()
    }, [supabase])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (status !== 'ready') {
            toast.error('El enlace de recuperación es inválido o expiró.')
            return
        }

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
        } catch {
            toast.error('Ocurrió un error al actualizar la contraseña.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
            {/* Ambient violet glow */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
            </div>

            <Card className="cl-animate-scale relative w-full max-w-md backdrop-blur-xl">
                <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover shadow-brand">
                        <ShieldCheck className="h-7 w-7 text-primary-foreground" aria-hidden />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Nueva Contraseña
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Ingresá una nueva contraseña segura para tu cuenta.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {status === 'invalid' ? (
                        <div className="space-y-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                El enlace de recuperación es inválido o expiró. Pedí uno nuevo desde la pantalla de recuperación.
                            </p>
                            <Button
                                type="button"
                                className="cl-press w-full font-semibold shadow-brand"
                                onClick={() => router.push('/olvide-password')}
                            >
                                Pedir un nuevo enlace
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={6}
                                    disabled={isLoading || status === 'checking'}
                                />
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={isLoading || status === 'checking'}
                                    className="cl-press w-full font-semibold shadow-brand"
                                >
                                    {isLoading ? 'Actualizando...' : status === 'checking' ? 'Verificando enlace...' : 'Actualizar contraseña'}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
