import { signOut } from '@/app/login/actions'
import { LogOut, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardNav } from './DashboardNav'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar (desktop) */}
            <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
                {/* Logo */}
                <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-brand">
                        <DollarSign className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-foreground">
                        CuentaLimpia
                    </span>
                </div>

                <DashboardNav />

                {/* Logout */}
                <div className="border-t border-sidebar-border p-3">
                    <form action={signOut}>
                        <Button
                            type="submit"
                            variant="ghost"
                            className="w-full justify-start gap-3 text-muted-foreground hover:bg-expense-subtle hover:text-expense"
                        >
                            <LogOut className="h-5 w-5" aria-hidden="true" />
                            Cerrar Sesión
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-background pb-16 lg:ml-64 lg:pb-0">{children}</main>

            {/* Bottom nav (mobile) */}
            <DashboardNav variant="bottom" />
        </div>
    )
}
