import { signOut } from '@/app/login/actions'
import Link from 'next/link'
import {
    LayoutDashboard,
    ArrowLeftRight,
    Settings,
    LogOut,
    DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/ingresos-egresos', label: 'Ingresos/Egresos', icon: ArrowLeftRight },

    { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {/* Logo */}
                <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
                        <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        CuentaLimpia
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
                        >
                            <item.icon className="h-5 w-5 transition-colors group-hover:text-emerald-500 dark:group-hover:text-emerald-400" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Logout */}
                <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                    <form action={signOut}>
                        <Button
                            type="submit"
                            variant="ghost"
                            className="w-full justify-start gap-3 text-slate-500 hover:bg-red-500/10 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400"
                        >
                            <LogOut className="h-5 w-5" />
                            Cerrar Sesión
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 bg-slate-50 dark:bg-slate-950">
                {children}
            </main>
        </div>
    )
}
