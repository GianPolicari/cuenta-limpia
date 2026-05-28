// Supabase Edge Function: budget-alert
// Invocada via Database Webhook en INSERT de la tabla `transactions`.
// Verifica umbrales de presupuesto y envía email con Resend si corresponde.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://cuentalimpia.app'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'alertas@cuentalimpia.app'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
})

interface TransactionRecord {
    id: string
    user_id: string
    amount: number
    category: string | null
    transaction_type: string | null
    transaction_date: string
}

interface WebhookPayload {
    type: 'INSERT' | 'UPDATE' | 'DELETE'
    table: string
    record: TransactionRecord
    old_record: TransactionRecord | null
}

Deno.serve(async (req: Request) => {
    // Solo acepta POST
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 })
    }

    // Verificar secret del webhook (opcional pero recomendado)
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
    if (webhookSecret) {
        const authHeader = req.headers.get('x-webhook-secret')
        if (authHeader !== webhookSecret) {
            return new Response('Unauthorized', { status: 401 })
        }
    }

    let payload: WebhookPayload
    try {
        payload = await req.json() as WebhookPayload
    } catch {
        return new Response('Bad Request', { status: 400 })
    }

    const { record } = payload

    // Solo procesar INSERTs de gastos con categoría
    if (payload.type !== 'INSERT') {
        return new Response(JSON.stringify({ skipped: 'not insert' }), { status: 200 })
    }
    if (record.transaction_type !== 'expense') {
        return new Response(JSON.stringify({ skipped: 'not expense' }), { status: 200 })
    }
    if (!record.category) {
        return new Response(JSON.stringify({ skipped: 'no category' }), { status: 200 })
    }

    const userId = record.user_id
    const category = record.category

    // Calcular mes actual en formato YYYY-MM
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    try {
        // 1. Calcular total gastado en esa categoría este mes
        const { data: spentData, error: spentError } = await supabaseAdmin
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('category', category)
            .eq('transaction_type', 'expense')
            .gte('transaction_date', `${month}-01`)
            .lt('transaction_date', getNextMonthStart(month))

        if (spentError) {
            console.error('Error calculando gasto:', spentError)
            return new Response(JSON.stringify({ error: spentError.message }), { status: 500 })
        }

        const totalSpent = (spentData ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0)

        // 2. Obtener presupuesto de esa categoría
        const { data: budgetData, error: budgetError } = await supabaseAdmin
            .from('budgets')
            .select('monthly_amount')
            .eq('user_id', userId)
            .eq('category_name', category)
            .maybeSingle()

        if (budgetError || !budgetData) {
            // Sin presupuesto → no hay nada que alertar
            return new Response(JSON.stringify({ skipped: 'no budget' }), { status: 200 })
        }

        const limit = budgetData.monthly_amount
        const pct = (totalSpent / limit) * 100

        // 3. Determinar qué umbral alcanzó
        const thresholdsToCheck: Array<'75' | '100'> = []
        if (pct >= 100) thresholdsToCheck.push('100')
        else if (pct >= 75) thresholdsToCheck.push('75')

        if (thresholdsToCheck.length === 0) {
            return new Response(JSON.stringify({ skipped: 'below threshold', pct }), { status: 200 })
        }

        // 4. Verificar preferencias del usuario
        const { data: prefsData } = await supabaseAdmin
            .from('user_alert_preferences')
            .select('email_alerts_enabled, threshold_75, threshold_100')
            .eq('user_id', userId)
            .maybeSingle()

        if (!prefsData?.email_alerts_enabled) {
            return new Response(JSON.stringify({ skipped: 'alerts disabled globally' }), { status: 200 })
        }

        // 5. Verificar override de categoría
        const { data: overrideData } = await supabaseAdmin
            .from('budget_alert_overrides')
            .select('alerts_enabled')
            .eq('user_id', userId)
            .eq('category_name', category)
            .maybeSingle()

        if (overrideData && overrideData.alerts_enabled === false) {
            return new Response(JSON.stringify({ skipped: 'category override disabled' }), { status: 200 })
        }

        // 6. Obtener email del usuario
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (userError || !userData.user?.email) {
            console.error('Error obteniendo usuario:', userError)
            return new Response(JSON.stringify({ error: 'user not found' }), { status: 500 })
        }
        const userEmail = userData.user.email

        // 7. Generar token de unsubscribe (simple, sin firma criptográfica — V1)
        const unsubscribeToken = btoa(
            JSON.stringify({ user_id: userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })
        )

        // 8. Enviar email por cada umbral pendiente
        const sentThresholds: string[] = []

        for (const threshold of thresholdsToCheck) {
            // Verificar que el threshold esté habilitado en prefs
            if (threshold === '75' && !prefsData.threshold_75) continue
            if (threshold === '100' && !prefsData.threshold_100) continue

            // Verificar idempotencia en alert_log
            const { data: logData } = await supabaseAdmin
                .from('alert_log')
                .select('id')
                .eq('user_id', userId)
                .eq('category_name', category)
                .eq('month', month)
                .eq('threshold', threshold)
                .maybeSingle()

            if (logData) {
                // Ya se envió este mes para este umbral
                continue
            }

            // Enviar email
            const emailHtml = buildEmailHtml({
                category,
                threshold,
                totalSpent,
                limit,
                pct,
                siteUrl: SITE_URL,
                unsubscribeToken,
            })

            const subject = threshold === '75'
                ? `Llevás gastado el 75% de tu presupuesto en ${category}`
                : `Superaste el presupuesto de ${category} este mes`

            const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: FROM_EMAIL,
                    to: userEmail,
                    subject,
                    html: emailHtml,
                }),
            })

            if (!emailRes.ok) {
                const errText = await emailRes.text()
                console.error(`Error enviando email para threshold ${threshold}:`, errText)
                continue
            }

            // Registrar en alert_log
            const { error: logError } = await supabaseAdmin
                .from('alert_log')
                .insert({
                    user_id: userId,
                    category_name: category,
                    month,
                    threshold,
                })

            if (logError) {
                console.error('Error insertando alert_log:', logError)
            } else {
                sentThresholds.push(threshold)
            }
        }

        return new Response(
            JSON.stringify({ ok: true, sentThresholds, pct: Math.round(pct) }),
            { status: 200 }
        )
    } catch (err) {
        console.error('Unexpected error:', err)
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
    }
})

// Retorna el primer día del mes siguiente en formato YYYY-MM-DD
function getNextMonthStart(month: string): string {
    const [year, mo] = month.split('-').map(Number)
    const next = new Date(year, mo, 1) // mes base-0, mo es base-1 → correcto
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`
}

function buildEmailHtml({
    category,
    threshold,
    totalSpent,
    limit,
    pct,
    siteUrl,
    unsubscribeToken,
}: {
    category: string
    threshold: '75' | '100'
    totalSpent: number
    limit: number
    pct: number
    siteUrl: string
    unsubscribeToken: string
}): string {
    const accentColor = threshold === '75' ? '#B45309' : '#DC2626'
    const pctDisplay = Math.round(pct)
    const spentFormatted = totalSpent.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    const limitFormatted = limit.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${threshold === '75' ? `Presupuesto al 75% — ${category}` : `Presupuesto superado — ${category}`}</title>
</head>
<body style="margin:0;padding:0;background:#F6F6FA;font-family:sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:14px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.06);">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#9090A0;">Alerta de presupuesto</p>
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0B0B12;">${category}</h2>
      <p style="margin:0 0 4px;font-size:48px;font-weight:800;color:${accentColor};line-height:1;">${pctDisplay}%</p>
      <p style="margin:0 0 20px;font-size:14px;color:#9090A0;">del presupuesto mensual</p>
      <p style="margin:0 0 24px;font-size:15px;color:#4A4A55;line-height:1.6;">
        Gastaste <strong style="color:#0B0B12;">$${spentFormatted}</strong> de tu presupuesto de <strong style="color:#0B0B12;">$${limitFormatted}</strong> para <strong style="color:#0B0B12;">${category}</strong> este mes.
      </p>
      <a href="${siteUrl}/dashboard/ingresos-egresos" style="display:inline-block;padding:12px 24px;background:#5B47E0;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        Ver mis gastos
      </a>
    </div>
    <div style="margin-top:24px;padding:0 8px;">
      <hr style="border:none;border-top:1px solid #E6E6EC;margin-bottom:16px;" />
      <p style="margin:0;font-size:12px;color:#9090A0;text-align:center;">
        Recibís este email porque tenés alertas de presupuesto activadas en CuentaLimpia.<br/>
        <a href="${siteUrl}/api/unsubscribe?token=${unsubscribeToken}" style="color:#9090A0;text-decoration:underline;">
          Desactivar estas alertas
        </a>
      </p>
    </div>
  </div>
</body>
</html>`
}
