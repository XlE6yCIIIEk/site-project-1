import { useEffect, useState, type FormEvent } from 'react'
import { isSupabaseConfigured, supabase, type Application, type ApplicationStatus } from './lib/supabase'
import './admin.css'

const labels: Record<ApplicationStatus, string> = { new: 'Новая', contacted: 'Связались', in_progress: 'В работе', completed: 'Завершена', cancelled: 'Отменена' }
const statuses = Object.keys(labels) as ApplicationStatus[]

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setLoading(true); setError('')
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (loginError) setError('Не удалось войти. Проверьте email и пароль.')
    else window.location.assign('/admin')
  }
  return <main className="admin-login"><form onSubmit={submit}><p className="admin-kicker">ПЕРЕЕЗД ПОД КЛЮЧ</p><h1>Вход в админку</h1><label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label><label>Пароль<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>{error && <p className="admin-error">{error}</p>}<button type="submit" disabled={loading}>{loading ? 'Входим…' : 'Войти'}</button></form></main>
}

function Dashboard() {
  const [applications, setApplications] = useState<Application[]>([])
  const [selected, setSelected] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  async function load() {
    if (!supabase) return
    setLoading(true)
    const { data, error: queryError } = await supabase.from('applications').select('*').order('created_at', { ascending: false })
    if (queryError) setError('Не удалось загрузить заявки.')
    else setApplications((data ?? []) as Application[])
    setLoading(false)
  }
  useEffect(() => { void load() }, [])
  async function changeStatus(application: Application, status: ApplicationStatus) {
    if (!supabase) return
    const { error: updateError } = await supabase.from('applications').update({ status }).eq('id', application.id)
    if (updateError) { setError('Не удалось обновить статус.'); return }
    const updated = { ...application, status }
    setApplications(items => items.map(item => item.id === application.id ? updated : item))
    setSelected(updated)
  }
  async function signOut() { await supabase?.auth.signOut(); window.location.assign('/admin/login') }
  return <main className="admin-page"><header className="admin-header"><a href="/">Ирина Лян <small>ПЕРЕЕЗД ПОД КЛЮЧ</small></a><div><span>Заявки</span><button onClick={() => void signOut()}>Выйти</button></div></header><div className="admin-content"><div className="admin-title"><div><p className="admin-kicker">УПРАВЛЕНИЕ</p><h1>Заявки</h1><p>Новых заявок: {applications.filter(a => a.status === 'new').length}</p></div><button className="refresh" onClick={() => void load()}>Обновить</button></div>{error && <p className="admin-error">{error}</p>}{loading ? <p className="admin-muted">Загружаем заявки…</p> : <div className="admin-table-wrap"><table><thead><tr><th>Дата</th><th>Имя</th><th>Телефон</th><th>Откуда</th><th>Куда</th><th>Переезд</th><th>Объём</th><th>Статус</th></tr></thead><tbody>{applications.map(application => <tr key={application.id} onClick={() => setSelected(application)}><td>{new Date(application.created_at).toLocaleDateString('ru-RU')}</td><td>{application.name}</td><td>{application.phone}</td><td>{application.from_address}</td><td>{application.to_address}</td><td>{new Date(`${application.moving_date}T00:00:00`).toLocaleDateString('ru-RU')}</td><td>{application.volume || '—'}</td><td><span className={`status ${application.status}`}>{labels[application.status]}</span></td></tr>)}</tbody></table>{applications.length === 0 && <p className="admin-muted">Заявок пока нет.</p>}</div>}</div>{selected && <aside className="application-panel"><button className="panel-close" aria-label="Закрыть" onClick={() => setSelected(null)}>×</button><p className="admin-kicker">ЗАЯВКА</p><h2>{selected.name}</h2><dl><dt>Телефон</dt><dd>{selected.phone}</dd><dt>Откуда</dt><dd>{selected.from_address}</dd><dt>Куда</dt><dd>{selected.to_address}</dd><dt>Дата переезда</dt><dd>{new Date(`${selected.moving_date}T00:00:00`).toLocaleDateString('ru-RU')}</dd><dt>Объём</dt><dd>{selected.volume || 'Не указан'}</dd><dt>Комментарий</dt><dd>{selected.comment || 'Нет'}</dd></dl><label>Статус<select value={selected.status} onChange={e => void changeStatus(selected, e.target.value as ApplicationStatus)}>{statuses.map(status => <option key={status} value={status}>{labels[status]}</option>)}</select></label></aside>}</main>
}

export function AdminApp() {
  const [ready, setReady] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  useEffect(() => { if (!supabase) { setReady(true); return }; void supabase.auth.getSession().then(({ data }) => { setLoggedIn(Boolean(data.session)); setReady(true) }) }, [])
  if (!isSupabaseConfigured) return <main className="admin-login"><div><p className="admin-kicker">НАСТРОЙКА НУЖНА</p><h1>Supabase не подключён</h1><p>Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в файл .env.</p></div></main>
  if (!ready) return <main className="admin-login"><p>Проверяем доступ…</p></main>
  if (window.location.pathname === '/admin/login') return loggedIn ? <Dashboard/> : <Login/>
  return loggedIn ? <Dashboard/> : <Login/>
}
