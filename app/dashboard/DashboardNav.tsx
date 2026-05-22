'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, CreditCard, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/ingresos-egresos', label: 'Ingresos & Egresos', icon: ArrowLeftRight },
    { href: '/dashboard/tarjetas', label: 'Tarjetas', icon: CreditCard },
    { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
]

export function DashboardNav({ variant = 'sidebar' }: { variant?: 'sidebar' | 'bottom' }) {
    const pathname = usePathname()
    const isActive = (href: string) =>
        href === '/dashboard' ? pathname === href : pathname.startsWith(href)

    if (variant === 'bottom') {
        return (
            <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-card lg:hidden">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-label={item.label}
                        className={cn(
                            'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs',
                            isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
                        )}
                    >
                        <item.icon className="h-5 w-5" aria-hidden="true" />
                    </Link>
                ))}
            </nav>
        )
    }

    return (
        <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        isActive(item.href)
                            ? 'bg-primary-subtle text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                >
                    <item.icon
                        className={cn('h-5 w-5', isActive(item.href) ? 'text-primary' : '')}
                        aria-hidden="true"
                    />
                    {item.label}
                </Link>
            ))}
        </nav>
    )
}
