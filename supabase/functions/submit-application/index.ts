import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const volumes = new Set(['Небольшой', 'Средний', 'Большой'])
const json = (body: Record<string, unknown>, status: number, origin?: string) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}) } })
const value = (item: unknown) => typeof item === 'string' ? item.trim() : ''
const hash = async (input: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)))].map(byte => byte.toString(16).padStart(2, '0')).join('')

async function notifyManager(application: { order_number: number; name: string; phone: string; from_address: string; to_address: string; moving_date: string; volume: string | null; comment: string | null }) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!botToken || !chatId) {
    console.warn('Telegram notification is disabled: secrets are not configured.')
    return false
  }

  const text = [
    `🆕 Новая заявка №${application.order_number}`,
    `👤 ${application.name}`,
    `📞 ${application.phone}`,
    `📦 ${application.from_address} → ${application.to_address}`,
    `📅 ${application.moving_date}`,
    application.volume ? `Объём: ${application.volume}` : '',
    application.comment ? `Комментарий: ${application.comment}` : '',
  ].filter(Boolean).join('\n')

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(8_000),
    })
    const result = await response.json().catch(() => ({})) as { ok?: boolean; description?: string }
    if (!response.ok || !result.ok) throw new Error(result.description || `Telegram HTTP ${response.status}`)
    return true
  } catch (error) {
    console.error('Telegram notification failed:', error instanceof Error ? error.message : error)
    return false
  }
}

Deno.serve(async request => {
  const origin = request.headers.get('origin')
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN')
  if (!origin || origin !== allowedOrigin) return json({ error: 'Origin is not allowed.' }, 403)
  const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', Vary: 'Origin' }
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return json({ error: 'Method is not allowed.' }, 405, origin)
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return json({ error: 'Invalid request.' }, 400, origin) }
  if (value(body.website)) return json({ ok: true }, 200, origin)

  const name = value(body.name), fromAddress = value(body.from_address), toAddress = value(body.to_address), movingDate = value(body.moving_date), volume = value(body.volume), comment = value(body.comment)
  if (body.privacy_consent !== true) return json({ error: 'Для отправки заявки необходимо согласие на обработку данных.' }, 400, origin)
  let phone = value(body.phone).replace(/\D/g, '')
  if (phone.length === 11 && phone.startsWith('8')) phone = `7${phone.slice(1)}`
  if (name.length < 2 || name.length > 80 || !/^7\d{10}$/.test(phone) || fromAddress.length < 3 || fromAddress.length > 200 || toAddress.length < 3 || toAddress.length > 200 || !/^\d{4}-\d{2}-\d{2}$/.test(movingDate) || (volume && !volumes.has(volume)) || comment.length > 1500) return json({ error: 'Проверьте заполнение полей.' }, 400, origin)

  const secret = Deno.env.get('TURNSTILE_SECRET_KEY'), token = value(body.turnstile_token), ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (!secret || !token) return json({ error: 'Подтвердите проверку и попробуйте ещё раз.' }, 400, origin)
  const verification = new FormData(); verification.set('secret', secret); verification.set('response', token); if (ip) verification.set('remoteip', ip)
  const verified = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: verification }).then(response => response.ok ? response.json() : { success: false }) as { success?: boolean }
  if (!verified.success) return json({ error: 'Проверка не пройдена.' }, 400, origin)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  for (const bucket of [`phone:${phone}`, ...(ip ? [`ip:${ip}`] : [])]) {
    const { data: allowed, error } = await supabase.rpc('consume_application_rate_limit', { p_bucket: await hash(bucket), p_max: 5, p_window_seconds: 900 })
    if (error || !allowed) return json({ error: 'Слишком много попыток. Попробуйте позднее.' }, 429, origin)
  }
  const { data: application, error } = await supabase.from('applications').insert({ name, phone: `+${phone}`, from_address: fromAddress, to_address: toAddress, moving_date: movingDate, volume: volume || null, comment: comment || null, privacy_consent_at: new Date().toISOString(), privacy_consent_version: 'privacy-v1', status: 'new' }).select('order_number, name, phone, from_address, to_address, moving_date, volume, comment').single()
  if (error || !application) return json({ error: 'Не удалось отправить заявку.' }, 500, origin)
  const notificationSent = await notifyManager(application)
  return json({ ok: true, order_number: application.order_number, notification_sent: notificationSent }, 201, origin)
})
