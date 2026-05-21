// Shared widgets for the kit: KpiCard, TransactionRow, CreditCardTile, InstallmentRow, Charts.

// ---------- KPI ----------
function KpiCard({ label, value, sub, tone = 'neutral', icon }) {
    const ringClass = {
        income:  'bg-income-subtle',
        expense: 'bg-expense-subtle',
        brand:   'bg-primary-subtle',
        info:    'bg-info-subtle',
        pending: 'bg-pending-subtle',
        neutral: ''
    }[tone] || '';
    const valClass = { income: 'fg-income', expense: 'fg-expense' }[tone] || '';
    return (
        <div className="card kpi">
            <div className="kpi-head">
                <span className="kpi-lbl">{label}</span>
                {icon && <span className={`kpi-ico ${ringClass}`} style={ringClass ? undefined : { background: 'var(--color-surface-2)', color: 'var(--color-fg-2)' }}><Icon name={icon} size={18}/></span>}
            </div>
            <div className={`kpi-val ${valClass}`}>{value}</div>
            {sub && <div className="kpi-sub">{sub}</div>}
        </div>
    );
}

// ---------- Transaction icon tint map ----------
const TINTS = {
    food:      { bg: '#FEF3C7', fg: '#B45309' },
    salary:    { bg: 'var(--color-income-subtle)', fg: 'var(--color-income-strong)' },
    transport: { bg: 'var(--color-info-subtle)',   fg: 'var(--color-info-strong)' },
    fun:       { bg: 'var(--color-primary-subtle)',fg: 'var(--color-primary)' },
    utility:   { bg: 'var(--color-pending-subtle)',fg: 'var(--color-pending-strong)' }
};

function TxIcon({ tint = 'food', icon }) {
    const t = TINTS[tint] || TINTS.food;
    return (
        <span style={{ width: 40, height: 40, borderRadius: 12, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={icon} size={18}/>
        </span>
    );
}

// ---------- TransactionRow ----------
function TransactionRow({ tx, cardName, onDelete, compact = false }) {
    const isIncome = tx.type === 'income';
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: 14, alignItems: 'center', padding: '12px 16px' }}>
            <TxIcon tint={tx.tint} icon={tx.icon}/>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                <div style={{ fontSize: 12, color: 'var(--color-fg-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{tx.category}</span>
                    {cardName && (<><span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--color-fg-3)' }}/><Icon name="credit-card" size={12}/><span>{cardName}</span></>)}
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div className={isIncome ? 'fg-income' : 'fg-expense'} style={{ fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                    {isIncome ? '+ ' : '− '}{formatARS(tx.amount)}
                </div>
                {!compact && <div style={{ fontSize: 11, color: 'var(--color-fg-3)' }}>{formatDateShort(tx.date)}</div>}
            </div>
            {onDelete && (
                <button className="btn btn-ghost btn-icon" aria-label="Eliminar" onClick={() => onDelete(tx.id)} style={{ width: 32, height: 32, color: 'var(--color-fg-3)' }}>
                    <Icon name="trash-2" size={14}/>
                </button>
            )}
        </div>
    );
}

// ---------- CreditCardTile ----------
function CreditCardTile({ card }) {
    const themes = {
        violet: 'linear-gradient(135deg, #7C6BFF 0%, #4131B5 100%)',
        dark:   'linear-gradient(135deg, #2E2E38 0%, #0B0B12 100%)',
        coral:  'linear-gradient(135deg, #F87171 0%, #DC2626 100%)'
    };
    return (
        <div style={{ aspectRatio: '1.586 / 1', borderRadius: 20, padding: 22, color: '#fff', background: themes[card.theme] || themes.violet, boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9 }}>{card.bank}</div>
                {card.activeCuotas > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                        {card.activeCuotas} cuota{card.activeCuotas > 1 ? 's activas' : ' activa'}
                    </div>
                )}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '0.18em', fontVariantNumeric: 'tabular-nums' }}>•••• •••• •••• {card.last4}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.owner}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7, marginTop: 2 }}>{card.type}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Saldo</div>
                    <div style={{ fontSize: 17, fontWeight: 700, fontVariantNumeric: 'tabular-nums lining-nums' }}>{formatARS(card.balance)}</div>
                </div>
            </div>
        </div>
    );
}

// ---------- InstallmentRow ----------
function InstallmentRow({ cuota, cardName }) {
    const pct = Math.round((cuota.current / cuota.total) * 100);
    return (
        <div className="card" style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: 18, alignItems: 'center', boxShadow: 'var(--shadow-xs)' }}>
            <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{cuota.description}</div>
                <div style={{ fontSize: 12, color: 'var(--color-fg-3)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Icon name="credit-card" size={12}/> {cardName} · iniciado {formatDateShort(cuota.startedAt)}
                </div>
            </div>
            <div>
                <div style={{ height: 6, background: 'var(--color-surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-pending-strong)', borderRadius: 999, transition: 'width var(--duration-slow) var(--ease-out)' }}/>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-fg-3)', marginTop: 4, textAlign: 'right' }}>{cuota.current} de {cuota.total} cuotas</div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums lining-nums' }}>{formatARS(cuota.perMonth)}</div>
                <div style={{ fontSize: 11, color: 'var(--color-fg-3)' }}>por mes</div>
            </div>
        </div>
    );
}

// ---------- Charts (simple inline SVG) ----------
function CategoryDonut({ data }) {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const series = ['#7C6BFF', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6'];
    const R = 64, C = 2 * Math.PI * R;
    let acc = 0;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <svg viewBox="0 0 180 180" width="180" height="180" style={{ flexShrink: 0 }}>
                <g transform="translate(90 90) rotate(-90)">
                    {data.map((d, i) => {
                        const len = (d.value / total) * C;
                        const seg = <circle key={i} r={R} fill="none" stroke={series[i % series.length]} strokeWidth="22" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} />;
                        acc += len;
                        return seg;
                    })}
                </g>
                <text x="90" y="86" textAnchor="middle" fontSize="11" fill="var(--color-fg-3)" fontWeight="500">Total</text>
                <text x="90" y="106" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--color-fg-1)" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{formatARS(total)}</text>
            </svg>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 999, background: series[i % series.length] }}/>
                        <span style={{ flex: 1, color: 'var(--color-fg-2)' }}>{d.name}</span>
                        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums lining-nums' }}>{formatARS(d.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MonthlyBars({ data }) {
    const max = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
    const W = 480, H = 200, padL = 36, padR = 8, padT = 12, padB = 28;
    const colW = (W - padL - padR) / data.length;
    const barW = 12;
    const yScale = v => H - padB - (v / max) * (H - padT - padB);
    return (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxHeight: 220 }}>
            {[0, 0.5, 1].map((p, i) => {
                const y = H - padB - p * (H - padT - padB);
                return (
                    <g key={i}>
                        <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="var(--color-border)" strokeDasharray="3 3"/>
                        <text x={padL - 6} y={y + 4} fontSize="11" fill="var(--color-fg-3)" textAnchor="end" style={{ fontVariantNumeric: 'tabular-nums' }}>${Math.round(max * p / 1000)}k</text>
                    </g>
                );
            })}
            {data.map((d, i) => {
                const cx = padL + i * colW + colW / 2;
                return (
                    <g key={d.month}>
                        <rect x={cx - barW - 2} y={yScale(d.income)}  width={barW} height={H - padB - yScale(d.income)}  rx="3" fill="#10B981"/>
                        <rect x={cx + 2}        y={yScale(d.expense)} width={barW} height={H - padB - yScale(d.expense)} rx="3" fill="#F87171"/>
                        <text x={cx} y={H - padB + 16} textAnchor="middle" fontSize="11" fill="var(--color-fg-2)">{d.month}</text>
                    </g>
                );
            })}
        </svg>
    );
}

Object.assign(window, { KpiCard, TransactionRow, TxIcon, CreditCardTile, InstallmentRow, CategoryDonut, MonthlyBars });
