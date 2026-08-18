import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { isSupabaseConfigured, supabase, type Application, type ApplicationStatus } from './lib/supabase'
import './admin.css'

const labels: Record<ApplicationStatus, string> = { new: 'Новая', contacted: 'Связались', in_progress: 'В работе', completed: 'Завершена', cancelled: 'Отменена' }
const statuses = Object.keys(labels) as ApplicationStatus[]
const folders: Array<{ id: 'all' | ApplicationStatus; label: string }> = [{ id: 'all', label: 'Все' }, ...statuses.map(status => ({ id: status, label: labels[status] }))]

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
  const [applications, setApplications] = useState<Application[]>([]), [selected, setSelected] = useState<Application | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const [folder, setFolder] = useState<'all' | ApplicationStatus>('all'), [query, setQuery] = useState(''), [sort, setSort] = useState<'newest' | 'oldest' | 'moving'>('newest')
  async function load() { if (!supabase) return; setLoading(true); const { data, error: queryError } = await supabase.from('applications').select('*').order('created_at', { ascending: false }); if (queryError) setError('Не удалось загрузить заявки.'); else setApplications((data ?? []) as Application[]); setLoading(false) }
  useEffect(() => { void load() }, [])
  const visible = useMemo(() => applications.filter(application => { const haystack = `${application.order_number} ${application.name} ${application.phone}`.toLowerCase(); return (folder === 'all' || application.status === folder) && haystack.includes(query.trim().toLowerCase()) }).sort((a, b) => sort === 'oldest' ? +new Date(a.created_at) - +new Date(b.created_at) : sort === 'moving' ? a.moving_date.localeCompare(b.moving_date) : +new Date(b.created_at) - +new Date(a.created_at)), [applications, folder, query, sort])
  async function changeStatus(application: Application, status: ApplicationStatus) { if (!supabase) return; const { error: updateError } = await supabase.from('applications').update({ status }).eq('id', application.id); if (updateError) { setError('Не удалось обновить статус.'); return }; const updated = { ...application, status }; setApplications(items => items.map(item => item.id === application.id ? updated : item)); setSelected(updated) }
  async function remove(application: Application) { if (!supabase || !window.confirm(`Удалить заказ №${application.order_number}?`)) return; const { error: deleteError } = await supabase.from('applications').delete().eq('id', application.id); if (deleteError) { setError('Не удалось удалить заявку.'); return }; setApplications(items => items.filter(item => item.id !== application.id)); setSelected(null) }
  async function signOut() { await supabase?.auth.signOut(); window.location.assign('/admin/login') }
  return <main className="admin-page"><header className="admin-header"><a href="/">Ирина Лян <small>ПЕРЕЕЗД ПОД КЛЮЧ</small></a><div><span>Заявки</span><button onClick={() => void signOut()}>Выйти</button></div></header><div className="admin-content"><div className="admin-title"><div><p className="admin-kicker">УПРАВЛЕНИЕ</p><h1>Заявки</h1><p>Новых заявок: {applications.filter(a => a.status === 'new').length}</p></div><button className="refresh" onClick={() => void load()}>Обновить</button></div><div className="admin-tools"><input aria-label="Поиск заявок" value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск: № заказа, имя, телефон"/><select aria-label="Сортировка" value={sort} onChange={event => setSort(event.target.value as typeof sort)}><option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option><option value="moving">По дате переезда</option></select></div><div className="admin-folders">{folders.map(item => <button className={folder === item.id ? 'is-active' : ''} key={item.id} onClick={() => setFolder(item.id)}>{item.label}<span>{item.id === 'all' ? applications.length : applications.filter(application => application.status === item.id).length}</span></button>)}</div>{error && <p className="admin-error">{error}</p>}{loading ? <p className="admin-muted">Загружаем заявки…</p> : <div className="admin-table-wrap"><table><thead><tr><th>№</th><th>Дата</th><th>Имя</th><th>Телефон</th><th>Откуда</th><th>Куда</th><th>Переезд</th><th>Статус</th></tr></thead><tbody>{visible.map(application => <tr key={application.id} onClick={() => setSelected(application)}><td>#{application.order_number}</td><td>{new Date(application.created_at).toLocaleDateString('ru-RU')}</td><td>{application.name}</td><td>{application.phone}</td><td>{application.from_address}</td><td>{application.to_address}</td><td>{new Date(`${application.moving_date}T00:00:00`).toLocaleDateString('ru-RU')}</td><td><span className={`status ${application.status}`}>{labels[application.status]}</span></td></tr>)}</tbody></table>{visible.length === 0 && <p className="admin-muted">Заявок не найдено.</p>}</div>}</div>{selected && <aside className="application-panel"><button className="panel-close" aria-label="Закрыть" onClick={() => setSelected(null)}>×</button><p className="admin-kicker">ЗАКАЗ №{selected.order_number}</p><h2>{selected.name}</h2><dl><dt>Телефон</dt><dd>{selected.phone}</dd><dt>Откуда</dt><dd>{selected.from_address}</dd><dt>Куда</dt><dd>{selected.to_address}</dd><dt>Дата переезда</dt><dd>{new Date(`${selected.moving_date}T00:00:00`).toLocaleDateString('ru-RU')}</dd><dt>Объём</dt><dd>{selected.volume || 'Не указан'}</dd><dt>Комментарий</dt><dd>{selected.comment || 'Нет'}</dd></dl><label>Статус<select value={selected.status} onChange={e => void changeStatus(selected, e.target.value as ApplicationStatus)}>{statuses.map(status => <option key={status} value={status}>{labels[status]}</option>)}</select></label><div className="panel-actions"><button onClick={() => void changeStatus(selected, 'completed')}>Завершить</button><button className="delete" onClick={() => void remove(selected)}>Удалить</button></div></aside>}</main>
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
