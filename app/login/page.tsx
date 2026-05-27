import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import Link from 'next/link'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const params = await searchParams
    const error = params?.error

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
                        CuentaLimpia
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Ingresá a tu cuenta para gestionar tus finanzas
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {error && (
                        <div className="rounded-lg border border-expense/20 bg-expense-subtle p-3 text-center text-sm text-expense">
                            {decodeURIComponent(error)}
                        </div>
                    )}

                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="tu@email.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Contraseña</Label>
                                <Link
                                    href="/olvide-password"
                                    className="relative z-10 text-xs font-medium text-slate-400 transition-colors hover:text-primary"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <Button
                                formAction={login}
                                type="submit"
                                className="cl-press w-full font-semibold shadow-brand"
                            >
                                Iniciar Sesión
                            </Button>
                        </div>
                    </form>

                    <div className="text-center text-sm text-slate-400">
                        ¿No tenés cuenta?{' '}
                        <Link
                            href="/register"
                            className="font-medium text-primary transition-colors hover:text-primary/80"
                        >
                            Crear Cuenta
                        </Link>
                    </div>

                    <p className="text-center text-xs text-slate-400">
                        Tu información financiera, siempre segura.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
