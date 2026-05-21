// Sidebar — desktop navigation. Active state from `route`.

function Sidebar({ route, setRoute, onSignOut, dark, toggleTheme }) {
    const items = [
        { id: 'dashboard',    label: 'Dashboard',         icon: 'layout-dashboard' },
        { id: 'transactions', label: 'Ingresos & Egresos', icon: 'arrow-left-right' },
        { id: 'cards',        label: 'Tarjetas',           icon: 'credit-card' },
        { id: 'settings',     label: 'Configuración',      icon: 'settings' }
    ];
    return (
        <aside className="sb" data-screen-label="Sidebar">
            <div className="sb-brand">
                <img src="../../assets/logo.svg" alt=""/>
                <b>CuentaLimpia</b>
            </div>
            <nav className="sb-nav">
                {items.map(it => (
                    <button
                        key={it.id}
                        className={`sb-item ${route === it.id ? 'active' : ''}`}
                        onClick={() => setRoute(it.id)}
                        aria-current={route === it.id ? 'page' : undefined}
                    >
                        <Icon name={it.icon} size={18}/>
                        {it.label}
                    </button>
                ))}
            </nav>
            <div className="sb-bottom">
                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 4px 12px' }}>
                    <ThemeToggle dark={dark} onToggle={toggleTheme} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px 12px', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 999, background: 'linear-gradient(135deg, #7C6BFF, #5B47E0)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>LR</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Lucía Romero</div>
                        <div style={{ fontSize: 11, color: 'var(--color-fg-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>lucia@email.com</div>
                    </div>
                </div>
                <button className="sb-item" onClick={onSignOut} style={{ color: 'var(--color-fg-3)' }}>
                    <Icon name="log-out" size={18}/>
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}

window.Sidebar = Sidebar;
