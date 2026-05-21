// CardsScreen — credit/debit cards grid + active installments below.

function CardsScreen({ ctx }) {
    const { cards, cuotas } = ctx;

    return (
        <div data-screen-label="Cards">
            <div className="page-head">
                <div>
                    <h1>Tarjetas</h1>
                    <div className="sub">Tus tarjetas de crédito y débito, con seguimiento de cuotas</div>
                </div>
                <div className="toolbar">
                    <Button variant="primary" icon="plus">Agregar tarjeta</Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18, marginBottom: 28 }}>
                {cards.map(c => <CreditCardTile key={c.id} card={c}/>)}
                <button style={{ aspectRatio: '1.586 / 1', borderRadius: 20, background: 'transparent', border: '2px dashed var(--color-border-strong)', color: 'var(--color-fg-2)', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 600 }}>
                    <Icon name="plus" size={28}/>
                    Agregar tarjeta
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <h2>Cuotas activas</h2>
                <span className="fg-3" style={{ fontSize: 12 }}>{cuotas.length} en curso · total por mes <b style={{ color: 'var(--color-fg-1)', fontVariantNumeric: 'tabular-nums lining-nums' }}>{formatARS(cuotas.reduce((s, c) => s + c.perMonth, 0))}</b></span>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
                {cuotas.map(q => <InstallmentRow key={q.id} cuota={q} cardName={cards.find(c => c.id === q.cardId)?.bank || '—'}/>)}
            </div>
        </div>
    );
}

window.CardsScreen = CardsScreen;
