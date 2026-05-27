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
            className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-lg backdrop-blur-md transition-all duration-300 motion-safe:hover:scale-110 hover:border-primary hover:bg-accent hover:text-primary lg:bottom-6 lg:right-6"
        >
            {isDark ? (
                <Sun className="h-5 w-5 transition-transform duration-300 motion-safe:hover:rotate-45" aria-hidden="true" />
            ) : (
                <Moon className="h-5 w-5 transition-transform duration-300 motion-safe:hover:-rotate-12" aria-hidden="true" />
            )}
        </button>
    )
}
