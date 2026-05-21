// TransactionsScreen — list with month filter, KPI summary, add modal.

function TransactionsScreen({ ctx }) {
    const { transactions, cards, addTransaction, deleteTransaction } = ctx;
    const [addOpen, setAddOpen] = useState(false);
    const [month, setMonth] = useState('5');
    const [year, setYear] = useState('2026');
    const [confirmDelete, setConfirmDelete] = useState(null);

    const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    const filtered = transactions.filter(t => {
        const d = new Date(t.date + 'T00:00:00');
        return d.getMonth() + 1 === Number(month) && d.getFullYear() === Number(year);
    });

    const income  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;

    // Group by date
    const groups = useMemo(() => {
        const m = new Map();
        filtered.forEach(t => {
            if (!m.has(t.date)) m.set(t.date, []);
            m.get(t.date).push(t);
        });
        return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    }, [filtered]);

    return (
        <div data-screen-label="Transactions">
            <div className="page-head">
                <div>
                    <h1>Ingresos &amp; Egresos</h1>
                    <div className="sub">Lo que entró y salió este mes</div>
                </div>
                <div className="toolbar">
                    <Select value={month} onChange={setMonth} options={months.map((m, i) => ({ value: String(i + 1), label: m }))}/>
                    <Select value={year} onChange={setYear} options={['2024','2025','2026','2027'].map(y => ({ value: y, label: y }))}/>
                    <Button variant="secondary" icon="download">Exportar CSV</Button>
                    <Button variant="primary" icon="plus" onClick={() => setAddOpen(true)}>Nueva operación</Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                <KpiCard label="Ingresos del mes" value={`+ ${formatARS(income)}`}  tone="income"  icon="arrow-up-right"/>
                <KpiCard label="Gastos del mes"   value={`− ${formatARS(expense)}`} tone="expense" icon="arrow-down-right"/>
                <KpiCard label="Balance"          value={formatARS(balance)}        tone={balance >= 0 ? 'income' : 'expense'} icon="wallet"/>
            </div>

            {filtered.length === 0 ? (
                <div style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border-strong)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Icon name="inbox" size={28}/></div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Sin operaciones</h3>
                    <p style={{ fontSize: 14, color: 'var(--color-fg-2)', margin: '6px 0 16px' }}>No hay registros para {months[Number(month) - 1]} {year}.</p>
                    <Button variant="primary" icon="plus" onClick={() => setAddOpen(true)}>Nueva operación</Button>
                </div>
            ) : (
                <div className="card" style={{ overflow: 'hidden' }}>
                    {groups.map(([date, txs], gi) => {
                        const net = txs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
                        return (
                            <div key={date}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', background: 'var(--color-surface-2)', borderTop: gi === 0 ? 'none' : '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-fg-2)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{formatDateLong(date)}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums lining-nums', color: net >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>{net >= 0 ? '+ ' : '− '}{formatARS(Math.abs(net))}</span>
                                </div>
                                {txs.map((t, i) => (
                                    <div key={t.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}>
                                        <TransactionRow tx={t} cardName={cards.find(c => c.id === t.cardId)?.bank || null} onDelete={() => setConfirmDelete(t)} compact={true}/>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={addTransaction} cards={cards}/>

            <Modal
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                title="¿Eliminar este gasto?"
                description={confirmDelete && `Estás por borrar ${confirmDelete.description} · ${formatARS(confirmDelete.amount)}. Esta acción no se puede deshacer.`}
                actions={
                    <React.Fragment>
                        <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                        <Button variant="destructive" icon="trash-2" onClick={() => { deleteTransaction(confirmDelete.id); setConfirmDelete(null); }}>Eliminar</Button>
                    </React.Fragment>
                }
            />
        </div>
    );
}

window.TransactionsScreen = TransactionsScreen;
