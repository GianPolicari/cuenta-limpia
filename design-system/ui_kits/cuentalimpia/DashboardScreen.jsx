// DashboardScreen — KPI grid + charts + dolar ticker, mirrors the codebase's dashboard.

function DashboardScreen({ ctx }) {
    const { transactions, cards } = ctx;
    const [showUSD, setShowUSD] = useState(false);
    const mep = 1408;

    // Filter to current month (May 2026 in mock data).
    const month = 5, year = 2026;
    const inMonth = transactions.filter(t => {
        const d = new Date(t.date + 'T00:00:00');
        return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
    const income  = inMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = inMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;
    const conv = v => showUSD ? v / mep : v;
    const fmt  = v => showUSD ? `US$ ${conv(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : formatARS(conv(v));

    // Category aggregation
    const catMap = new Map();
    inMonth.filter(t => t.type === 'expense').forEach(t => catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount));
    const catData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

    // Monthly trend (made up months for demo)
    const monthly = [
        { month: 'Ene', income: 720000, expense: 520000 },
        { month: 'Feb', income: 780000, expense: 610000 },
        { month: 'Mar', income: 820000, expense: 580000 },
        { month: 'Abr', income: 760000, expense: 640000 },
        { month: 'May', income: income, expense: expense }
    ];

    return (
        <div data-screen-label="Dashboard">
            <div className="page-head">
                <div>
                    <h1>Dashboard</h1>
                    <div className="sub">Mayo 2026 · Resumen de tus finanzas</div>
                </div>
                <div className="toolbar">
                    <button onClick={() => setShowUSD(!showUSD)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 12,
                                     background: showUSD ? 'var(--color-income-subtle)' : 'var(--color-surface)',
                                     border: `1px solid ${showUSD ? 'var(--color-income-strong)' : 'var(--color-border)'}`,
                                     cursor: 'pointer', font: 'inherit' }}>
                        <div style={{ position: 'relative', width: 36, height: 20, borderRadius: 999, background: showUSD ? 'var(--color-income-strong)' : 'var(--gray-300)', transition: 'background var(--duration-base)' }}>
                            <div style={{ position: 'absolute', top: 2, left: showUSD ? 18 : 2, width: 16, height: 16, borderRadius: 999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left var(--duration-base)' }}/>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: showUSD ? 'var(--color-income)' : 'var(--color-fg-2)' }}>Ver en USD MEP</span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
                        <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-income-subtle)', color: 'var(--color-income-strong)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="dollar-sign" size={16}/>
                        </span>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--color-fg-3)', fontWeight: 500 }}>Dólar MEP</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums lining-nums' }}>$ 1.408</span>
                                <span style={{ fontSize: 11, color: 'var(--color-income)', fontWeight: 600 }}>+0,8%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                <KpiCard label="Ingresos del mes"  value={`+ ${fmt(income)}`}  sub={`${inMonth.filter(t => t.type === 'income').length} ingresos registrados`} tone="income"  icon="arrow-up-right"/>
                <KpiCard label="Gastos del mes"    value={`− ${fmt(expense)}`} sub={`${inMonth.filter(t => t.type === 'expense').length} transacciones`}  tone="expense" icon="arrow-down-right"/>
                <KpiCard label="Balance del mes"   value={fmt(balance)}        sub="Ingresos − Gastos"                          tone={balance >= 0 ? 'income' : 'expense'} icon="wallet"/>
                <KpiCard label="Tarjetas activas"  value={String(cards.length)} sub={`${cards.reduce((s, c) => s + c.activeCuotas, 0)} cuotas en curso`}          tone="brand"  icon="credit-card"/>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16, marginBottom: 24 }}>
                <div className="card card-pad-lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                        <h2>Gastos por categoría</h2>
                        <span className="fg-3" style={{ fontSize: 12 }}>Mayo 2026</span>
                    </div>
                    {catData.length > 0
                        ? <CategoryDonut data={catData}/>
                        : <div className="fg-3" style={{ textAlign: 'center', padding: '48px 0' }}>Sin gastos este mes</div>
                    }
                </div>
                <div className="card card-pad-lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                        <h2>Ingresos vs Gastos</h2>
                        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--color-fg-2)' }}>
                            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#10B981', marginRight: 6, verticalAlign: 'middle' }}/>Ingresos</span>
                            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#F87171', marginRight: 6, verticalAlign: 'middle' }}/>Gastos</span>
                        </div>
                    </div>
                    <MonthlyBars data={monthly}/>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid var(--color-border)' }}>
                    <h2 style={{ fontSize: 18 }}>Últimas operaciones</h2>
                    <a href="#" onClick={(e) => { e.preventDefault(); }} style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Ver todas →</a>
                </div>
                <div>
                    {inMonth.slice(0, 5).map((t, i) => (
                        <div key={t.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}>
                            <TransactionRow tx={t} cardName={cards.find(c => c.id === t.cardId)?.bank || null}/>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

window.DashboardScreen = DashboardScreen;
