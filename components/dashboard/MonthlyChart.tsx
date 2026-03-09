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
            <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-xl">
                <p className="mb-1 text-sm font-medium text-white">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.dataKey === 'ingresos' ? 'Ingresos' : 'Gastos'}: {showUSD ? 'US$ ' : '$'}
                        {entry.value.toLocaleString(showUSD ? 'en-US' : 'es-AR', { minimumFractionDigits: showUSD ? 2 : 0, maximumFractionDigits: showUSD ? 2 : 0 })}
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
            <div className="flex h-[300px] items-center justify-center text-slate-500">
                Sin datos mensuales disponibles
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} barGap={4}>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                />
                <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip showUSD={showUSD} />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
                <Bar
                    dataKey="ingresos"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                />
                <Bar
                    dataKey="gastos"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
