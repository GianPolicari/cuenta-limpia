import { signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import Link from 'next/link'

export default async function RegisterPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const params = await searchParams
    const error = params?.error

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
            {/* Ambient violet glow */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
            </div>

            <Card className="cl-animate-scale relative w-full max-w-md backdrop-blur-xl">
                <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C6BFF] to-[#5B47E0] shadow-brand">
                        <DollarSign className="h-7 w-7 text-white" aria-hidden />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Crear Cuenta
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Registrate para empezar a gestionar tus finanzas
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
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <Button
                                formAction={signup}
                                type="submit"
                                className="cl-press w-full font-semibold shadow-brand"
                            >
                                Crear Cuenta
                            </Button>
                        </div>
                    </form>

                    <div className="text-center text-sm text-muted-foreground">
                        ¿Ya tenés cuenta?{' '}
                        <Link
                            href="/login"
                            className="font-medium text-primary transition-colors hover:text-primary/80"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                        Tu información financiera, siempre segura.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
