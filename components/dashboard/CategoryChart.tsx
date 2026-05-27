'use client'

import { useState, useEffect } from 'react'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts'
import { formatMoney } from '@/lib/format'
import { CHART_COLORS_HEX } from '@/lib/theme'

interface CategoryData {
    name: string
    value: number
}

interface CategoryChartProps {
    data: CategoryData[]
    showUSD?: boolean
}

function CustomTooltip({ active, payload, showUSD }: { active?: boolean; payload?: Array<{ name: string; value: number }>; showUSD?: boolean }) {
    if (active && payload && payload.length) {
        return (
            <div
                className="shadow-md"
                style={{ background: 'var(--popover)', borderRadius: '10px', padding: '12px' }}
            >
                <p className="text-sm font-medium text-popover-foreground">{payload[0].name}</p>
                <p className="text-sm text-muted-foreground">
                    {formatMoney(payload[0].value, showUSD ? 'USD' : 'ARS')}
                </p>
            </div>
        )
    }
    return null
}

export default function CategoryChart({ data, showUSD }: CategoryChartProps) {
    const [colors, setColors] = useState(CHART_COLORS_HEX)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        const style = getComputedStyle(document.documentElement)
        const resolved = CHART_COLORS_HEX.map((fallback, i) =>
            style.getPropertyValue(`--chart-${i + 1}`).trim() || fallback
        )
        setColors(resolved)
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReducedMotion(mq.matches)
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    if (!data || data.length === 0) {
        return (
            <div className="flex h-[260px] sm:h-[320px] items-center justify-center text-muted-foreground">
                Sin datos de categorías este mes
            </div>
        )
    }

    return (
        <div className="h-[260px] sm:h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={!prefersReducedMotion}
                >
                    {data.map((_, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={colors[index % colors.length]}
                            className="transition-all duration-200 hover:opacity-80"
                        />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip showUSD={showUSD} />} />
                <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                        <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
        </div>
    )
}
