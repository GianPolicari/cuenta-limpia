// LoginScreen — matches CuentaLimpia auth shell: centered card on bg with ambient violet glow.

function LoginScreen({ onLogin, dark, toggleTheme }) {
    const [email, setEmail] = useState('lucia@email.com');
    const [pass, setPass] = useState('demo1234');
    const [err, setErr] = useState(null);

    function submit(e) {
        e.preventDefault();
        if (!email || !pass || pass.length < 6) {
            setErr('Tu contraseña tiene que tener al menos 6 caracteres.');
            return;
        }
        setErr(null);
        onLogin?.();
    }

    return (
        <div className="app auth" data-screen-label="Login">
            <div className="auth-glow tr"/>
            <div className="auth-glow bl"/>
            <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2 }}>
                <ThemeToggle dark={dark} onToggle={toggleTheme} />
            </div>
            <div className="card" style={{ width: '100%', maxWidth: 420, padding: 32, position: 'relative', zIndex: 1, borderRadius: 20, boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                    <img src="../../assets/logo.svg" alt="CuentaLimpia" width="56" height="56" style={{ boxShadow: 'var(--shadow-brand)', borderRadius: 16 }}/>
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Hola de nuevo</h1>
                        <p style={{ fontSize: 14, color: 'var(--color-fg-2)', margin: '4px 0 0' }}>Ingresá a tu cuenta para gestionar tus finanzas</p>
                    </div>
                </div>

                {err && (
                    <div style={{ background: 'var(--color-expense-subtle)', color: 'var(--color-expense)', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <Icon name="alert-circle" size={14}/> {err}
                    </div>
                )}

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Email">
                        <input className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required/>
                    </Field>
                    <Field label="Contraseña" helpText={!err && '¿Olvidaste tu contraseña?'}>
                        <input className="input" type="password" autoComplete="current-password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required/>
                    </Field>
                    <Button variant="primary" size="lg" type="submit">Iniciar sesión</Button>
                </form>

                <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--color-border)', textAlign: 'center', fontSize: 13, color: 'var(--color-fg-2)' }}>
                    ¿No tenés cuenta? <a href="#" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Crear cuenta</a>
                </div>
                <p style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: 'var(--color-fg-3)' }}>Tu información financiera, siempre segura.</p>
            </div>
        </div>
    );
}

window.LoginScreen = LoginScreen;
