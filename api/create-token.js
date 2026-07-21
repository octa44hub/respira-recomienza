const { createClient } = require('@supabase/supabase-js')
const { Resend } = require('resend')

// ─── Gera token único legível ───────────────────────────────────────────────
function generateToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin O,0,I,1 para evitar confusión
  let token = ''
  for (let i = 0; i < 8; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

// ─── Extrai dados do payload da Hotmart ────────────────────────────────────
// Hotmart: body.data.buyer.email | body.event
function extractFromHotmart(body) {
  const d = body?.data || {}
  const buyer = d?.buyer || {}

  const email = (
    buyer.email ||
    d?.customer?.email ||
    body?.email ||
    ''
  ).toLowerCase().trim()

  const name =
    buyer.name ||
    buyer.full_name ||
    d?.customer?.name ||
    null

  const event = (body?.event || '').toUpperCase()

  return { email, name, event }
}

// ─── Classifica o evento Hotmart ────────────────────────────────────────────
// Eventos Hotmart: PURCHASE_APPROVED, PURCHASE_REFUNDED, PURCHASE_CANCELED,
//                  SUBSCRIPTION_CANCELLATION
function classifyEvent(event) {
  const approved = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE']
  const cancelled = ['PURCHASE_REFUNDED', 'PURCHASE_CANCELED', 'PURCHASE_CHARGEBACK',
                     'SUBSCRIPTION_CANCELLATION']

  if (approved.includes(event)) return 'approved'
  if (cancelled.includes(event)) return 'cancelled'
  return 'unknown'
}

// ─── Template de e-mail ────────────────────────────────────────────────────
function emailHTML(token, name, appUrl) {
  const firstName = name ? name.split(' ')[0] : 'Bienvenida'
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu acceso a Respira y Recomienza</title>
</head>
<body style="margin:0;padding:0;background:#F7F3ED;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3ED;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(44,74,50,0.08);">
          <tr>
            <td style="background:linear-gradient(160deg,#1E3325,#2C4A32,#3D6B48);padding:48px 40px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:4px;color:rgba(201,169,110,0.7);text-transform:uppercase;">Bienvenida a tu camino</p>
              <h1 style="margin:0;font-size:38px;font-weight:300;letter-spacing:6px;color:#F7F3ED;line-height:1.1;">RESPIRA</h1>
              <p style="margin:6px 0 0;font-size:13px;letter-spacing:4px;color:#C9A96E;">— y —</p>
              <h1 style="margin:4px 0 0;font-size:38px;font-weight:300;letter-spacing:6px;color:#F7F3ED;line-height:1.1;">RECOMIENZA</h1>
              <p style="margin:16px 0 0;font-size:10px;letter-spacing:3px;color:rgba(247,243,237,0.35);text-transform:uppercase;">21 DÍAS · CLARIDAD · PROSPERIDAD</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 20px;font-size:18px;font-weight:400;color:#2C4A32;line-height:1.4;">${firstName}, tu acceso está listo 🌿</p>
              <p style="margin:0 0 28px;font-size:14px;color:#6A6A6A;line-height:1.7;">Gracias por confiar en este camino. Durante los próximos 21 días vas a limpiar lo que no te sirve, reprogramar lo que te limita y crear la base de la prosperidad real.</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#F5EDD8;border:1.5px solid #E8D5A3;border-radius:14px;padding:24px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:10px;letter-spacing:2.5px;color:#8A6830;text-transform:uppercase;">Tu código de acceso</p>
                    <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:6px;color:#2C4A32;font-family:'Courier New',monospace;">${token}</p>
                    <p style="margin:10px 0 0;font-size:11px;color:#B09A6A;">Guarda este código. Lo necesitarás para acceder al app.</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" style="display:inline-block;background:#C9A96E;color:#2C4A32;text-decoration:none;border-radius:12px;padding:16px 40px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">ACCEDER A MI CAMINO</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#6A6A6A;line-height:1.7;">O accede directamente:<br>
              <a href="${appUrl}" style="color:#2C4A32;">${appUrl}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3ED;border-radius:12px;padding:20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;color:#2C4A32;text-transform:uppercase;font-family:Arial,sans-serif;">Cómo acceder</p>
                    <p style="margin:0 0 8px;font-size:13px;color:#4A4A4A;line-height:1.6;font-family:Arial,sans-serif;">1. Abre el enlace de arriba en tu celular</p>
                    <p style="margin:0 0 8px;font-size:13px;color:#4A4A4A;line-height:1.6;font-family:Arial,sans-serif;">2. Ingresa el código: <strong style="color:#2C4A32;letter-spacing:2px;">${token}</strong></p>
                    <p style="margin:0;font-size:13px;color:#4A4A4A;line-height:1.6;font-family:Arial,sans-serif;">3. Agrega a la pantalla de inicio para acceso rápido</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#2C4A32;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(247,243,237,0.5);">Respira y Recomienza · AMTM Negócios Digitais</p>
              <p style="margin:6px 0 0;font-size:11px;color:rgba(201,169,110,0.5);">✦ 21 días · Claridad · Prosperidad</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Handler principal ─────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-hotmart-hottok')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  // Log completo para debug (útil na primeira integração)
  console.log('[hotmart-webhook] body:', JSON.stringify(req.body))
  console.log('[hotmart-webhook] headers:', JSON.stringify(req.headers))

  // Autenticação — Hotmart envia o hottok no header x-hotmart-hottok
  const hottok = req.headers['x-hotmart-hottok']
  if (process.env.WEBHOOK_SECRET && hottok !== process.env.WEBHOOK_SECRET) {
    console.log('[hotmart-webhook] hottok inválido:', hottok)
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { email, name, event } = extractFromHotmart(req.body)
  const action = classifyEvent(event)

  console.log('[hotmart-webhook] email:', email, '| event:', event, '| action:', action)

  if (!email) {
    console.error('[hotmart-webhook] e-mail não encontrado no payload')
    return res.status(200).json({ ok: false, message: 'Email no encontrado', body: req.body })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

  // ── CANCELAMENTO / REEMBOLSO → desativa o token ──────────────────────────
  if (action === 'cancelled') {
    const { error } = await supabase
      .from('tokens')
      .update({ active: false })
      .eq('email', email)

    if (error) console.error('[hotmart-webhook] erro ao desativar token:', error)
    else console.log('[hotmart-webhook] token desativado para:', email)

    return res.status(200).json({ ok: true, action: 'token_deactivated', email })
  }

  // ── EVENTO DESCONHECIDO → ignora mas retorna 200 ─────────────────────────
  if (action === 'unknown') {
    console.log('[hotmart-webhook] evento ignorado:', event)
    return res.status(200).json({ ok: true, message: 'Evento ignorado: ' + event })
  }

  // ── COMPRA APROVADA → cria ou reutiliza token ────────────────────────────
  const { data: existing } = await supabase
    .from('tokens')
    .select('token, active')
    .eq('email', email)
    .single()

  let token

  if (existing) {
    token = existing.token
    if (!existing.active) {
      await supabase.from('tokens').update({ active: true }).eq('email', email)
      console.log('[hotmart-webhook] token reativado para:', email)
    } else {
      console.log('[hotmart-webhook] token já existe para:', email)
    }
  } else {
    token = generateToken()
    const { error: insertError } = await supabase
      .from('tokens')
      .insert({ token, email })

    if (insertError) {
      console.error('[hotmart-webhook] erro ao inserir token:', insertError)
      return res.status(500).json({ error: 'Error al crear token', detail: insertError.message })
    }
    console.log('[hotmart-webhook] novo token criado para:', email)
  }

  // ── Envia e-mail com o código ─────────────────────────────────────────────
  const appUrl = process.env.APP_URL || 'https://app-respira.seudominio.com'
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: emailError } = await resend.emails.send({
      from: `Respira y Recomienza <${fromEmail}>`,
      to: email,
      subject: `${name ? name.split(' ')[0] + ', tu' : 'Tu'} acceso a Respira y Recomienza está aquí 🌿`,
      html: emailHTML(token, name, appUrl)
    })
    if (emailError) console.error('[hotmart-webhook] erro Resend:', emailError)
    else console.log('[hotmart-webhook] e-mail enviado para:', email)
  } catch (emailError) {
    console.error('[hotmart-webhook] exceção ao enviar e-mail:', emailError)
    // No falla — el token fue creado con éxito
  }

  return res.status(200).json({ ok: true, action: 'token_created', token, email })
}
