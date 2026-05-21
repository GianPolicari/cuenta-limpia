// AddTransactionModal — captures description/amount/date/type/category/card.

function AddTransactionModal({ open, onClose, onSubmit, cards }) {
    const [type, setType] = useState('expense');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('2026-05-26');
    const [category, setCategory] = useState('');
    const [cardId, setCardId] = useState('');
    const [isCuota, setIsCuota] = useState(false);
    const [cuotaCount, setCuotaCount] = useState(3);

    useEffect(() => { if (open) { setType('expense'); setDescription(''); setAmount(''); setCategory(''); setCardId(''); setIsCuota(false); } }, [open]);

    const cats = type === 'expense'
        ? ['Supermercado','Transporte','Servicios','Alquiler','Salidas','Salud','Hogar','Suscripciones']
        : ['Salario','Trabajo extra','Inversiones','Otros'];

    function submit() {
        if (!description || !amount) return;
        // Icon/tint heuristic
        const iconMap = { Supermercado: ['shopping-cart', 'food'], Transporte: ['bus', 'transport'], Servicios: ['zap', 'utility'], Alquiler: ['home', 'utility'], Salidas: ['film', 'fun'], Salud: ['heart-pulse', 'utility'], Hogar: ['lamp', 'utility'], Suscripciones: ['music', 'fun'], Salario: ['briefcase', 'salary'], 'Trabajo extra': ['briefcase', 'salary'], Inversiones: ['trending-up', 'salary'], Otros: ['circle-dollar-sign', 'salary'] };
        const [icon, tint] = iconMap[category] || ['circle-dollar-sign', 'fun'];
        onSubmit({
            description,
            amount: Number(String(amount).replace(/\./g, '').replace(/,/g, '.')) || 0,
            type, date, category, icon, tint,
            cardId: cardId || null,
            isCuota: type === 'expense' && isCuota,
            cuotaCount: isCuota ? cuotaCount : null
        });
        onClose?.();
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Nueva operación"
            description="Registrá un ingreso o un gasto."
            actions={
                <React.Fragment>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={submit} disabled={!description || !amount}>Guardar</Button>
                </React.Fragment>
            }
        >
            <Field label="Tipo">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button
                        type="button"
                        className={`btn btn-md ${type === 'expense' ? '' : 'btn-secondary'}`}
                        style={type === 'expense' ? { background: 'var(--color-expense-subtle)', color: 'var(--color-expense)', boxShadow: 'none', border: '1px solid var(--color-expense-subtle)' } : {}}
                        onClick={() => setType('expense')}>
                        <Icon name="arrow-down-right" size={14}/> Gasto
                    </button>
                    <button
                        type="button"
                        className={`btn btn-md ${type === 'income' ? '' : 'btn-secondary'}`}
                        style={type === 'income' ? { background: 'var(--color-income-subtle)', color: 'var(--color-income)', boxShadow: 'none', border: '1px solid var(--color-income-subtle)' } : {}}
                        onClick={() => setType('income')}>
                        <Icon name="arrow-up-right" size={14}/> Ingreso
                    </button>
                </div>
            </Field>

            <Field label="Descripción">
                <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Compra en Carrefour" autoFocus/>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Monto">
                    <AmountInput value={amount} onChange={setAmount}/>
                </Field>
                <Field label="Fecha">
                    <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)}/>
                </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Categoría">
                    <Select value={category} onChange={setCategory}
                            options={[{ value: '', label: 'Elegí una categoría' }, ...cats.map(c => ({ value: c, label: c }))]}/>
                </Field>
                <Field label="Tarjeta (opcional)">
                    <Select value={cardId} onChange={setCardId}
                            options={[{ value: '', label: 'Sin tarjeta' }, ...cards.map(c => ({ value: c.id, label: `${c.bank} ${c.type}` }))]}/>
                </Field>
            </div>

            {type === 'expense' && (
                <div style={{ background: 'var(--color-surface-2)', padding: 14, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                        <input type="checkbox" checked={isCuota} onChange={e => setIsCuota(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }}/>
                        ¿Es un pago en cuotas?
                    </label>
                    {isCuota && (
                        <Field label="Cantidad de cuotas">
                            <input className="input" type="number" min="2" max="24" value={cuotaCount} onChange={e => setCuotaCount(Number(e.target.value))} style={{ maxWidth: 120 }}/>
                        </Field>
                    )}
                </div>
            )}
        </Modal>
    );
}

window.AddTransactionModal = AddTransactionModal;
