// SettingsScreen — profile + categories + theme toggle (visual only).

function SettingsScreen({ ctx }) {
    const expenseCats = ['Supermercado','Transporte','Servicios','Alquiler','Salidas','Salud','Hogar','Suscripciones'];
    const incomeCats = ['Salario','Trabajo extra','Inversiones','Otros'];

    return (
        <div data-screen-label="Settings">
            <div className="page-head">
                <div><h1>Configuración</h1><div className="sub">Tu perfil y categorías</div></div>
            </div>

            <div className="card card-pad-lg" style={{ marginBottom: 16 }}>
                <h2 style={{ marginBottom: 14 }}>Perfil</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 999, background: 'linear-gradient(135deg, #7C6BFF, #5B47E0)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20 }}>LR</div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>Lucía Romero</div>
                        <div style={{ fontSize: 13, color: 'var(--color-fg-3)' }}>lucia@email.com</div>
                    </div>
                </div>
                <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
                    <Field label="Nombre completo"><input className="input" defaultValue="Lucía Romero"/></Field>
                    <Field label="Email"><input className="input" type="email" defaultValue="lucia@email.com"/></Field>
                    <Button variant="primary" style={{ alignSelf: 'flex-start' }}>Guardar cambios</Button>
                </div>
            </div>

            <div className="card card-pad-lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                    <h2>Categorías</h2>
                    <Button variant="ghost" size="sm" icon="plus">Nueva categoría</Button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-fg-3)', marginBottom: 8 }}>Gastos</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {expenseCats.map(c => <span key={c} style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--gray-100)', color: 'var(--color-fg-2)', fontSize: 13, fontWeight: 500, border: '1px solid var(--color-border)' }}>{c}</span>)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-fg-3)', marginBottom: 8 }}>Ingresos</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {incomeCats.map(c => <span key={c} style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--gray-100)', color: 'var(--color-fg-2)', fontSize: 13, fontWeight: 500, border: '1px solid var(--color-border)' }}>{c}</span>)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

window.SettingsScreen = SettingsScreen;
