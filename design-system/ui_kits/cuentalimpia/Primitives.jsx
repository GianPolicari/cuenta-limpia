// Shared primitives + icon helper for the CuentaLimpia UI Kit.
// Loaded as a <script type="text/babel"> file. Exports onto window.

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// Icon: thin wrapper over Lucide global. Falls back to a square if missing.
function Icon({ name, size = 18, strokeWidth = 2, className = '', style = {} }) {
    const ref = useRef(null);
    useEffect(() => {
        if (window.lucide && ref.current) window.lucide.createIcons({ icons: window.lucide.icons, attrs: { 'stroke-width': strokeWidth }, nameAttr: 'data-lucide' });
    }, [name, strokeWidth]);
    return (
        <i
            ref={ref}
            data-lucide={name}
            className={`icon ${className}`}
            style={{ width: size, height: size, display: 'inline-flex', flexShrink: 0, ...style }}
        />
    );
}

// Format helpers
function formatARS(v, { sign = false } = {}) {
    const abs = Math.abs(v);
    const s = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(abs);
    if (!sign) return s;
    return v >= 0 ? `+ ${s}` : `− ${s}`;
}
function formatDateShort(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}
function formatDateLong(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Button
function Button({ variant = 'primary', size = 'md', icon, iconRight, children, className = '', ...rest }) {
    return (
        <button className={`btn btn-${size} btn-${variant} ${className}`} {...rest}>
            {icon && <Icon name={icon} size={16} />}
            {children}
            {iconRight && <Icon name={iconRight} size={16} />}
        </button>
    );
}

// Badge — semantic chip with icon
function Badge({ tone = 'neutral', icon, children }) {
    const cls = {
        income: 'bg-income-subtle',
        expense: 'bg-expense-subtle',
        pending: 'bg-pending-subtle',
        info: 'bg-info-subtle',
        brand: 'bg-primary-subtle',
        neutral: ''
    }[tone] || '';
    const styleNeutral = tone === 'neutral' ? { background: 'var(--gray-100)', color: 'var(--color-fg-2)', border: '1px solid var(--color-border)' } : {};
    return (
        <span className={`badge ${cls}`} style={styleNeutral}>
            {icon && <Icon name={icon} size={12} strokeWidth={2.5} />}
            {children}
        </span>
    );
}

// Field — labeled input wrapper
function Field({ label, helpText, error, children }) {
    return (
        <div className="field">
            {label && <label className="field-label">{label}</label>}
            {children}
            {(error || helpText) && (
                <span className={`help-text ${error ? 'err' : ''}`}>{error || helpText}</span>
            )}
        </div>
    );
}

// AmountInput — currency-prefixed
function AmountInput({ value, onChange, placeholder = '0,00', ...rest }) {
    return (
        <div className="amount-input">
            <span className="sym">$</span>
            <input
                className="input"
                inputMode="decimal"
                placeholder={placeholder}
                value={value ?? ''}
                onChange={e => onChange?.(e.target.value)}
                {...rest}
            />
        </div>
    );
}

// Select (native)
function Select({ value, onChange, options, ...rest }) {
    return (
        <select className="select" value={value} onChange={e => onChange?.(e.target.value)} {...rest}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
}

// Modal
function Modal({ open, onClose, title, description, children, actions }) {
    useEffect(() => {
        if (!open) return;
        const onKey = e => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                <div className="modal-head">
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>
                    {description && <p style={{ fontSize: 14, color: 'var(--color-fg-2)', margin: '4px 0 0' }}>{description}</p>}
                </div>
                <div className="modal-body">{children}</div>
                <div className="modal-actions">{actions}</div>
            </div>
        </div>
    );
}

// Toast manager (single)
function useToasts() {
    const [items, setItems] = useState([]);
    const push = useCallback((t) => {
        const id = Math.random().toString(36).slice(2);
        setItems(curr => [...curr, { id, ...t }]);
        setTimeout(() => setItems(curr => curr.filter(x => x.id !== id)), 3500);
    }, []);
    const node = (
        <div className="toast-stack">
            {items.map(t => {
                const tone = t.tone || 'success';
                const ico = { success: 'check', error: 'alert-circle', warn: 'alert-triangle', info: 'info' }[tone];
                const ringCls = { success: 'bg-income-subtle', error: 'bg-expense-subtle', warn: 'bg-pending-subtle', info: 'bg-info-subtle' }[tone];
                return (
                    <div className="toast" key={t.id}>
                        <div className={`toast-ico ${ringCls}`}><Icon name={ico} size={14} /></div>
                        <div style={{ flex: 1 }}>
                            <div className="toast-title">{t.title}</div>
                            {t.desc && <div className="toast-desc">{t.desc}</div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
    return { push, node };
}

Object.assign(window, { Icon, Button, Badge, Field, AmountInput, Select, Modal, useToasts, formatARS, formatDateShort, formatDateLong, ThemeToggle });

// ---------- ThemeToggle ----------
function ThemeToggle({ dark, onToggle, size = 'md' }) {
    const isSm = size === 'sm';
    const W = isSm ? 36 : 44;
    const H = isSm ? 20 : 24;
    const TH = isSm ? 16 : 20;
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={dark}
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: isSm ? '4px 8px 4px 10px' : '4px 8px 4px 12px',
                borderRadius: 999,
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                font: 'inherit', cursor: 'pointer', color: 'var(--color-fg-2)',
                transition: 'all var(--duration-base) var(--ease-out)'
            }}
        >
            <Icon name={dark ? 'moon' : 'sun'} size={isSm ? 13 : 14} />
            {!isSm && <span style={{ fontSize: 12, fontWeight: 600 }}>{dark ? 'Oscuro' : 'Claro'}</span>}
            <span style={{ position: 'relative', width: W, height: H, borderRadius: 999, background: dark ? 'var(--color-primary)' : 'var(--gray-300)', flexShrink: 0, transition: 'background var(--duration-base)' }}>
                <span style={{ position: 'absolute', top: 2, left: dark ? (W - TH - 2) : 2, width: TH, height: TH, borderRadius: 999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left var(--duration-base) var(--ease-out)' }}/>
            </span>
        </button>
    );
}
