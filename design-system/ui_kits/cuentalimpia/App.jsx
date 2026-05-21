// App-level navigation + mock data for the CuentaLimpia UI Kit.

const MOCK_TRANSACTIONS = [
    { id: 't1', date: '2026-05-26', description: 'Compra en Carrefour', amount: 12450, type: 'expense', category: 'Supermercado', cardId: 'c1', icon: 'shopping-cart', tint: 'food' },
    { id: 't2', date: '2026-05-26', description: 'SUBE',                 amount:  3000, type: 'expense', category: 'Transporte',   cardId: 'c2', icon: 'bus', tint: 'transport' },
    { id: 't3', date: '2026-05-25', description: 'Cine — Cinemark Palermo', amount: 8200, type: 'expense', category: 'Salidas',    cardId: 'c1', icon: 'film', tint: 'fun' },
    { id: 't4', date: '2026-05-25', description: 'Freelance — proyecto Mariana', amount: 33200, type: 'income', category: 'Trabajo extra', cardId: null, icon: 'briefcase', tint: 'salary' },
    { id: 't5', date: '2026-05-22', description: 'Edenor — luz',         amount: 18400, type: 'expense', category: 'Servicios',   cardId: 'c2', icon: 'zap', tint: 'utility' },
    { id: 't6', date: '2026-05-20', description: 'Spotify Familiar',     amount:  4290, type: 'expense', category: 'Suscripciones', cardId: 'c1', icon: 'music', tint: 'fun' },
    { id: 't7', date: '2026-05-18', description: 'Alquiler depto Almagro', amount: 145000, type: 'expense', category: 'Alquiler',  cardId: null, icon: 'home', tint: 'utility' },
    { id: 't8', date: '2026-05-15', description: 'Heladera Whirlpool — cuota 3/12', amount: 41500, type: 'expense', category: 'Hogar', cardId: 'c1', icon: 'refrigerator', tint: 'food' },
    { id: 't9', date: '2026-05-02', description: 'Sueldo Mayo',          amount: 850000, type: 'income', category: 'Salario',     cardId: null, icon: 'briefcase', tint: 'salary' }
];

const MOCK_CARDS = [
    { id: 'c1', bank: 'Galicia',   type: 'Visa Crédito',        last4: '4827', owner: 'Lucía Romero', balance: 145620, theme: 'violet', activeCuotas: 3 },
    { id: 'c2', bank: 'Santander', type: 'Mastercard Débito',   last4: '0193', owner: 'Lucía Romero', balance:  92100, theme: 'dark',   activeCuotas: 0 },
    { id: 'c3', bank: 'BBVA',      type: 'Visa Crédito',        last4: '7714', owner: 'Lucía Romero', balance:  46800, theme: 'coral',  activeCuotas: 1 }
];

const MOCK_CUOTAS = [
    { id: 'q1', description: 'Heladera Whirlpool',     cardId: 'c1', startedAt: '2026-03-02', current: 3,  total: 12, perMonth: 41500 },
    { id: 'q2', description: 'Notebook ASUS Vivobook', cardId: 'c1', startedAt: '2025-11-15', current: 8,  total: 12, perMonth: 28300 },
    { id: 'q3', description: 'Curso de inglés',        cardId: 'c3', startedAt: '2026-04-10', current: 2,  total:  6, perMonth: 12700 }
];

const CATEGORIES_EXPENSE = ['Supermercado', 'Transporte', 'Servicios', 'Alquiler', 'Salidas', 'Salud', 'Hogar', 'Suscripciones'];
const CATEGORIES_INCOME  = ['Salario', 'Trabajo extra', 'Inversiones', 'Otros'];

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function App() {
    const [route, setRoute] = useState('login'); // login | dashboard | transactions | cards | settings
    const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
    const [cards] = useState(MOCK_CARDS);
    const [cuotas] = useState(MOCK_CUOTAS);

    // Theme — global, persisted, available to every screen + the login form.
    const [dark, setDark] = useState(() => {
        try { return localStorage.getItem('cl-theme') === 'dark'; } catch { return false; }
    });
    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
        try { localStorage.setItem('cl-theme', dark ? 'dark' : 'light'); } catch {}
    }, [dark]);
    const toggleTheme = () => setDark(d => !d);

    const { push: toast, node: toastsNode } = useToasts();

    function addTransaction(tx) {
        const id = 'new-' + Math.random().toString(36).slice(2);
        setTransactions(curr => [{ id, ...tx }, ...curr]);
        toast({ tone: 'success', title: 'Operación guardada', desc: `${tx.description} · ${formatARS(tx.amount)}` });
    }

    function deleteTransaction(id) {
        setTransactions(curr => curr.filter(t => t.id !== id));
        toast({ tone: 'success', title: 'Eliminado correctamente' });
    }

    if (route === 'login') {
        return (
            <React.Fragment>
                <LoginScreen
                    onLogin={() => { setRoute('dashboard'); toast({ tone: 'success', title: '¡Hola Lucía!', desc: 'Bienvenida de nuevo a CuentaLimpia.' }); }}
                    dark={dark}
                    toggleTheme={toggleTheme}
                />
                {toastsNode}
            </React.Fragment>
        );
    }

    const ctx = { transactions, cards, cuotas, addTransaction, deleteTransaction, toast };

    return (
        <div className="app">
            <Sidebar
                route={route}
                setRoute={setRoute}
                onSignOut={() => setRoute('login')}
                dark={dark}
                toggleTheme={toggleTheme}
            />
            <main className="main">
                {route === 'dashboard'    && <DashboardScreen ctx={ctx} />}
                {route === 'transactions' && <TransactionsScreen ctx={ctx} />}
                {route === 'cards'        && <CardsScreen ctx={ctx} />}
                {route === 'settings'     && <SettingsScreen ctx={ctx} />}
            </main>
            {toastsNode}
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
