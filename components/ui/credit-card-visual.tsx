import { cn } from '@/lib/utils'
import { CreditCard } from 'lucide-react'

interface CreditCardVisualProps {
  name: string
  card_type: string
  color: string | null
  activeCuotas?: number
  className?: string
}

function darkenHex(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (n >> 16) - amount)
  const g = Math.max(0, ((n >> 8) & 0xff) - amount)
  const b = Math.max(0, (n & 0xff) - amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function isValidHex(hex: string | null): hex is string {
  return !!hex && /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export function CreditCardVisual({
  name,
  card_type,
  color,
  activeCuotas = 0,
  className,
}: CreditCardVisualProps) {
  const gradient = isValidHex(color)
    ? `linear-gradient(135deg, ${color} 0%, ${darkenHex(color, 40)} 100%)`
    : 'linear-gradient(135deg, #7C6BFF 0%, #4131B5 100%)'

  const isCredit = card_type.toLowerCase().startsWith('cr')

  return (
    <div
      className={cn('relative overflow-hidden rounded-[20px] p-5 text-white shadow-md', className)}
      style={{ aspectRatio: '1.586 / 1', background: gradient }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <span className="text-sm font-semibold opacity-90 truncate max-w-[60%]">{name}</span>
        {activeCuotas > 0 && (
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)' }}
          >
            {activeCuotas} {activeCuotas === 1 ? 'cuota activa' : 'cuotas activas'}
          </span>
        )}
      </div>

      {/* Masked number */}
      <div className="my-4 text-lg font-semibold tracking-[0.18em] tabular-nums opacity-80">
        •••• •••• •••• ••••
      </div>

      {/* Bottom row */}
      <div className="flex items-end justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
          {isCredit ? 'Crédito' : 'Débito'}
        </p>
        <CreditCard className="h-5 w-5 opacity-40" aria-hidden="true" />
      </div>
    </div>
  )
}
