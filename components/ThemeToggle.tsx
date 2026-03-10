'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => setMounted(true), [])

    if (!mounted) return null

    const isDark = theme === 'dark'

    return (
        <button
            aria-label="Cambiar tema"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-slate-700/50 bg-slate-800/80 text-slate-300 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-emerald-500/50 hover:bg-slate-700/80 hover:text-emerald-400 hover:shadow-emerald-500/10 dark:border-slate-700/50 dark:bg-slate-800/80 dark:text-slate-300"
        >
            {isDark ? (
                <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-45" />
            ) : (
                <Moon className="h-5 w-5 transition-transform duration-300 hover:-rotate-12" />
            )}
        </button>
    )
}
