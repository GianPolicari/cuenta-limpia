'use client'

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
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Sin datos mensuales disponibles
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} barGap={4}>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
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
                <Tooltip content={<CustomTooltip showUSD={showUSD} />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
                <Bar
                    dataKey="ingresos"
                    fill="var(--chart-2)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                />
                <Bar
                    dataKey="gastos"
                    fill="var(--chart-8)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
