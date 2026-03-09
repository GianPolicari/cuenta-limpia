import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
                        CuentaLimpia
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Ingresá a tu cuenta para gestionar tus finanzas
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {error && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-600 dark:text-red-400">
                            {decodeURIComponent(error)}
                        </div>
                    )}

                    <form className="space-y-4">
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
                                className="border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Contraseña
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500"
                            />
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <Button
                                formAction={login}
                                type="submit"
                                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/40"
                            >
                                Iniciar Sesión
                            </Button>
                        </div>
                    </form>

                    <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                        ¿No tenés cuenta?{' '}
                        <Link
                            href="/register"
                            className="font-medium text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                        >
                            Crear cuenta
                        </Link>
                    </div>

                    <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                        Tu información financiera, siempre segura.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
