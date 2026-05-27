'use client'

import { useState, useEffect } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { formatMoney } from '@/lib/format'
import { INCOME_STRONG_HEX, EXPENSE_STRONG_HEX, BORDER_LIGHT_HEX } from '@/lib/theme'

interface MonthlyData {
    month: string
    gastos: number
    ingresos: number
}

interface MonthlyChartProps {
    data: MonthlyData[]
    showUSD?: boolean
}

function CustomTooltip({ active, payload, label, showUSD }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string; showUSD?: boolean }) {
    if (active && payload && payload.length) {
        return (
            <div
                className="shadow-md"
                style={{ background: 'var(--popover)', borderRadius: '10px', padding: '12px' }}
            >
                <p className="mb-1 text-sm font-medium text-popover-foreground">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.dataKey === 'ingresos' ? 'Ingresos' : 'Gastos'}: {formatMoney(entry.value, showUSD ? 'USD' : 'ARS')}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

export default function MonthlyChart({ data, showUSD }: MonthlyChartProps) {
    const [colors, setColors] = useState({ income: INCOME_STRONG_HEX, expense: EXPENSE_STRONG_HEX, border: BORDER_LIGHT_HEX })
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        const resolveColors = () => {
            const style = getComputedStyle(document.documentElement)
            setColors({
                income: style.getPropertyValue('--income-strong').trim() || INCOME_STRONG_HEX,
                expense: style.getPropertyValue('--expense-strong').trim() || EXPENSE_STRONG_HEX,
                border: style.getPropertyValue('--border').trim() || BORDER_LIGHT_HEX,
            })
        }
        resolveColors()
        const observer = new MutationObserver(resolveColors)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReducedMotion(mq.matches)
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
        mq.addEventListener('change', handler)
        return () => {
            observer.disconnect()
            mq.removeEventListener('change', handler)
        }
    }, [])

    if (!data || data.length === 0) {
        return (
            <div className="flex h-[260px] sm:h-[320px] items-center justify-center text-muted-foreground">
                Sin datos mensuales disponibles
            </div>
        )
    }

    return (
        <div className="h-[260px] sm:h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={colors.border}
                    vertical={false}
                />
                <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    className="text-muted-foreground"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    className="text-muted-foreground"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip showUSD={showUSD} />} cursor={{ fill: 'transparent' }} />
                <Bar
                    dataKey="ingresos"
                    fill={colors.income}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                    isAnimationActive={!prefersReducedMotion}
                />
                <Bar
                    dataKey="gastos"
                    fill={colors.expense}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                    isAnimationActive={!prefersReducedMotion}
                />
            </BarChart>
        </ResponsiveContainer>
        </div>
    )
}
