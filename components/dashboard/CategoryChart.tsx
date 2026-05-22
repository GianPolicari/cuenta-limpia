'use client'

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts'
import { formatMoney } from '@/lib/format'

interface CategoryData {
    name: string
    value: number
}

interface CategoryChartProps {
    data: CategoryData[]
    showUSD?: boolean
}

const COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
    'var(--chart-6)',
    'var(--chart-7)',
    'var(--chart-8)',
]

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
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
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
                        <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}
