import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
        return new NextResponse(unsubscribeHtml('Token inválido', false), {
            status: 400,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
    }

    let userId: string | null = null

    try {
        const decoded = JSON.parse(atob(token)) as { user_id: string; exp: number }

        if (!decoded.user_id || !decoded.exp) {
            throw new Error('Token malformado')
        }

        if (Date.now() > decoded.exp) {
            return new NextResponse(unsubscribeHtml('El enlace de desactivación expiró. Podés desactivar las alertas desde tu configuración.', false), {
                status: 410,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            })
        }

        userId = decoded.user_id
    } catch {
        return new NextResponse(unsubscribeHtml('El enlace no es válido. Podés desactivar las alertas desde tu configuración.', false), {
            status: 400,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
    }

    try {
        // Usamos service-role implícito via supabase server client con bypass RLS
        // El createClient de server usa el anon key, pero el upsert aplica RLS.
        // Para este endpoint no hay sesión de usuario, así que usamos el service role key.
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        const res = await fetch(`${supabaseUrl}/rest/v1/user_alert_preferences`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
                'Prefer': 'resolution=merge-duplicates',
            },
            body: JSON.stringify({
                user_id: userId,
                email_alerts_enabled: false,
                updated_at: new Date().toISOString(),
            }),
        })

        if (!res.ok) {
            const text = await res.text()
            console.error('Unsubscribe upsert failed:', text)
            throw new Error('Error al actualizar preferencias')
        }
    } catch (err) {
        console.error('Unsubscribe error:', err)
        return new NextResponse(
            unsubscribeHtml('Ocurrió un error. Por favor, desactivá las alertas desde tu configuración.', false),
            { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
    }

    return new NextResponse(
        unsubscribeHtml('Tus alertas de presupuesto fueron desactivadas.', true),
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
}

function unsubscribeHtml(message: string, success: boolean): string {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? ''
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Alertas de presupuesto — CuentaLimpia</title>
</head>
<body style="font-family: sans-serif; background: #F6F6FA; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
  <div style="max-width: 420px; width: 100%; background: #fff; border-radius: 14px; padding: 40px 32px; text-align: center; box-shadow: 0 2px 16px rgba(0,0,0,.08);">
    <div style="width: 48px; height: 48px; border-radius: 50%; background: ${success ? '#DCFCE7' : '#FEE2E2'}; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
      <span style="font-size: 22px;">${success ? '✓' : '✕'}</span>
    </div>
    <h1 style="color: #0B0B12; font-size: 20px; font-weight: 700; margin: 0 0 12px;">${success ? 'Alertas desactivadas' : 'Error'}</h1>
    <p style="color: #4A4A55; font-size: 15px; margin: 0 0 28px;">${message}</p>
    ${siteUrl ? `<a href="${siteUrl}/dashboard/configuracion" style="display: inline-block; padding: 12px 24px; background: #5B47E0; color: #fff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Ir a configuración</a>` : ''}
  </div>
</body>
</html>`
}
