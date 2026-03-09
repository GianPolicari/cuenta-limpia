'use client'

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts'

interface CategoryData {
    name: string
    value: number
}

interface CategoryChartProps {
    data: CategoryData[]
    showUSD?: boolean
}

const COLORS = [
    '#10b981', // emerald-500
    '#6366f1', // indigo-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
]

function CustomTooltip({ active, payload, showUSD }: { active?: boolean; payload?: Array<{ name: string; value: number }>; showUSD?: boolean }) {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-xl">
                <p className="text-sm font-medium text-white">{payload[0].name}</p>
                <p className="text-sm text-emerald-400">
                    {showUSD ? 'US$ ' : '$'}
                    {payload[0].value.toLocaleString(showUSD ? 'en-US' : 'es-AR', { minimumFractionDigits: showUSD ? 2 : 0, maximumFractionDigits: showUSD ? 2 : 0 })}
                </p>
            </div>
        )
    }
    return null
}

export default function CategoryChart({ data, showUSD }: CategoryChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center text-slate-500">
                Sin datos de categorías este mes
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
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
                >
                    {data.map((_, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
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
                        <span className="text-xs text-slate-400">{value}</span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}
