import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { AdminApp } from './admin'
import { supabase } from './lib/supabase'

declare global { interface Window { turnstile?: { render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'error-callback': () => void; 'expired-callback': () => void }) => string; reset: (id?: string) => void } } }

const WHATSAPP_NUMBER = '77077731752'
const WHATSAPP_MESSAGE = 'Здравствуйте! Хочу переехать и обсудить с вами все детали.'
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
const INSTAGRAM_URL = 'https://www.instagram.com/poryadok_s_irinoi/'

type IconName = 'box' | 'spark' | 'truck' | 'chair' | 'heart' | 'clock' | 'home' | 'layers' | 'arrow' | 'check' | 'menu' | 'close' | 'whatsapp' | 'instagram' | 'pin' | 'star' | 'quote'
function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    box: <><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/></>,
    spark: <><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/><path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17Z"/></>,
    truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    chair: <><path d="M5 11V5h10v6M4 11h13v6H4zM6 17v3M15 17v3"/><path d="M17 11h2v9"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    arrow: <><path d="M5 12h14"/><path d="m14 6 6 6-6 6"/></>,
    check: <path d="m5 12 4.2 4.2L19 6.5"/>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m5 5 14 14M19 5 5 19"/></>,
    whatsapp: <><path d="M20.5 11.8a8.5 8.5 0 0 1-12.7 7.4L3.5 20.5l1.3-4.1A8.5 8.5 0 1 1 20.5 11.8Z"/><path d="M8.4 7.7c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.7c.1.2.1.4 0 .6l-.5.7c.5 1 1.2 1.7 2.2 2.2l.7-.5c.2-.1.4-.1.6 0l1.7.7c.3.1.4.3.4.5v.5c0 .3 0 .5-.4.7-.4.2-1.2.4-2 .2-1-.3-2.4-1.1-3.7-2.4s-2.1-2.7-2.4-3.7c-.2-.8 0-1.6.2-2Z"/></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r=".8" fill="currentColor" stroke="none"/></>,
    pin: <><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2"/></>,
    star: <path d="m12 3 2.78 5.64 6.22.9-4.5 4.38 1.06 6.19L12 17.2l-5.56 2.91 1.06-6.19L3 9.54l6.22-.9L12 3Z"/>,
    quote: <path d="M9.5 8.5H6.7A2.7 2.7 0 0 0 4 11.2v2.1A2.7 2.7 0 0 0 6.7 16h.8v-2.8H6.2c0-1.1.6-1.8 1.8-1.8h1.5V8.5Zm8.5 0h-2.8a2.7 2.7 0 0 0-2.7 2.7v2.1a2.7 2.7 0 0 0 2.7 2.7h.8v-2.8h-1.3c0-1.1.6-1.8 1.8-1.8H18V8.5Z"/>
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const nav = [['О нас','about'],['Услуги','services'],['Как это работает','process'],['Почему мы','why'],['Отзывы','reviews'],['Контакты','contacts'],['FAQ','faq']]
const problems = ['Не знаете, с чего начать и как всё организовать','Вещи нужно разобрать и понять, что действительно стоит перевозить','После переезда невозможно найти нужную вещь','Коробки неделями стоят неразобранными','Не знаете, куда что положить в новом доме','Нужно разбирать и собирать мебель','Переезд забирает всё время и силы']
const services = [
  ['Расхламление','Разберём вещи и поможем избавиться от ненужного до переезда.','spark'],['Сортировка','Разделим всё по категориям и решим, что и куда поедет.','layers'],['Упаковка','Бережно упакуем вещи и правильно подготовим их к перевозке.','box'],['Разбор мебели','Разберём мебель перед переездом.','chair'],['Перевозка','Организуем транспортировку вещей в новый дом.','truck'],['Сборка мебели','Соберём мебель на новом месте.','chair'],['Распаковка','Распакуем коробки, чтобы вам не пришлось жить среди них.','box'],['Организация пространства','Разложим вещи по местам и создадим удобную систему хранения.','home']
] as const
const audiences = [['Вы переезжаете всей семьёй','home'],['У вас много вещей','box'],['Нет времени заниматься переездом','clock'],['Переезд нужно организовать быстро','arrow'],['Хотите сразу избавиться от лишнего','spark'],['Не хотите месяцами жить среди коробок','layers'],['Хотите сразу получить порядок в новом доме','heart']] as const
const processSteps = [
  ['01', 'Знакомимся', 'Обсуждаем задачу, даты и ваши пожелания.'],
  ['02', 'Оцениваем объём', 'Понимаем, сколько вещей, мебели и помощников понадобится.'],
  ['03', 'Составляем план', 'Фиксируем этапы, команду и удобный сценарий переезда.'],
  ['04', 'Упаковываем', 'Бережно собираем и маркируем всё, что отправится в новый дом.'],
  ['05', 'Перевозим', 'Координируем погрузку, транспорт и разгрузку.'],
  ['06', 'Распаковываем и организуем', 'Собираем пространство, в котором можно жить сразу.']
] as const
const reviews = [
  ['Алия М.', 'Переезд семьи в новую квартиру', 'Я думала, что переезд займёт месяц. Ирина с командой всё разобрали, упаковали и разложили по местам — вечером мы уже ужинали дома.', 'АМ'],
  ['Дарья К.', 'Переезд с двумя детьми', 'Очень бережный подход к вещам и к моему времени. Не пришлось контролировать каждую коробку: всё было подписано и оказалось именно там, где нужно.', 'ДК'],
  ['Елена С.', 'Переезд из дома в квартиру', 'Отдельное спасибо за расхламление. Мы не перевезли лишнее и получили гораздо более лёгкий, понятный дом.', 'ЕС'],
  ['Марина Т.', 'Переезд офиса и личных вещей', 'Команда спокойно решила сложную задачу за один день: мебель разобрали, перевезли и собрали. Всё чётко по плану.', 'МТ']
] as const
const faqItems = [
  ['Сколько стоит переезд?', 'Стоимость рассчитывается индивидуально после знакомства с задачей. Она зависит от объёма вещей, состава услуг, маршрута, этажности и времени, которое понадобится команде.'],
  ['От чего зависит стоимость?', 'На расчёт влияют количество вещей и мебели, необходимость упаковки, разборки и сборки, расстояние между адресами, наличие лифта и дополнительные услуги.'],
  ['Нужно ли мне самостоятельно упаковывать вещи?', 'Нет, если вы заказываете упаковку. Мы привезём материалы, бережно всё упакуем и подпишем коробки, чтобы на новом месте ничего не потерялось.'],
  ['Вы разбираете мебель?', 'Да. Мы можем разобрать мебель перед переездом, подготовить её к перевозке и собрать на новом месте.'],
  ['Вы собираете мебель?', 'Да, сборка мебели входит в переезд под ключ или может быть добавлена как отдельная услуга.'],
  ['Работаете ли вы за пределами города?', 'Да, обсудим маршрут и условия заранее. Напишите нам, откуда и куда планируется переезд.'],
  ['Сколько времени занимает переезд?', 'Срок зависит от объёма и набора услуг. Небольшой переезд может занять один день, а подготовка большого дома — несколько этапов.'],
  ['Что делать с ненужными вещами?', 'Поможем отсортировать вещи до переезда и решить, что оставить, отдать, продать или утилизировать.'],
  ['Можно ли заказать только упаковку?', 'Да. Можно заказать отдельные этапы: упаковку, разбор мебели, перевозку, распаковку или организацию пространства.'],
  ['Как происходит расчёт?', 'Сначала уточняем детали и оцениваем объём, затем предлагаем понятный состав работ и предварительную стоимость. После согласования бронируем дату.']
] as const

function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  const headerOffset = window.innerWidth <= 640 ? 72 : 84
  const destination = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset)
  const start = window.scrollY
  const distance = destination - start
  const duration = Math.min(700, Math.max(360, Math.abs(distance) * .42))
  const startedAt = performance.now()
  const easeInOutCubic = (progress: number) => progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
  function frame(now: number) {
    const progress = Math.min(1, (now - startedAt) / duration)
    window.scrollTo(0, start + distance * easeInOutCubic(progress))
    if (progress < 1) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

function Placeholder({ label, className = '' }: { label: string; className?: string }) { return <div className={`placeholder ${className}`}><span>{label}</span><i/><b/></div> }
function Button({ children, variant = 'gold', href, className = '' }: { children: ReactNode; variant?: 'gold'|'outline'|'dark'; href?: string; className?: string }) { const cls = `button ${variant} ${className}`; const external = href?.startsWith('http'); const internalTarget = href?.startsWith('#') ? href.slice(1) : null; return href ? <a className={cls} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} onClick={event => { if (internalTarget) { event.preventDefault(); scrollToSection(internalTarget) } }}>{children}</a> : <button className={cls}>{children}</button> }

function Navbar() {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState('')
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => { document.body.classList.toggle('locked', open); return () => document.body.classList.remove('locked') }, [open])
  useEffect(() => {
    const updateScrolled = () => setScrolled(current => { const next = window.scrollY > 18; return current === next ? current : next })
    updateScrolled()
    window.addEventListener('scroll', updateScrolled, { passive: true })
    return () => window.removeEventListener('scroll', updateScrolled)
  }, [])
  useEffect(() => {
    const sections = nav.map(([, id]) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section))
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveId(visible.target.id)
    }, { rootMargin: '-22% 0px -62% 0px', threshold: [0, .15, .4] })
    sections.forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [])
  function handleNavigation(event: ReactMouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault()
    setActiveId(id)
    setOpen(false)
    window.requestAnimationFrame(() => scrollToSection(id))
  }
  return <header className={scrolled ? 'nav is-scrolled' : 'nav'}><div className="nav-inner"><a className="brand" href="#top" onClick={event => handleNavigation(event, 'top')}><span>Ирина Лян</span><small>ПЕРЕЕЗД ПОД КЛЮЧ</small></a><nav className={open ? 'nav-links is-open' : 'nav-links'}>{nav.map(([label,id]) => <a className={activeId === id ? 'is-active' : ''} key={id} href={`#${id}`} onClick={event => handleNavigation(event, id)}>{label}</a>)}</nav><a className="wa-nav" href={whatsappUrl} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18}/><span>WhatsApp</span></a><button className="menu" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={open} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'}/></button></div></header> }

function Turnstile({ onToken, onError }: { onToken: (token: string) => void; onError: () => void }) {
  const element = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | undefined>(undefined)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
  useEffect(() => {
    if (!siteKey) { onError(); return }
    const render = () => { if (element.current && window.turnstile && !widgetId.current) widgetId.current = window.turnstile.render(element.current, { sitekey: siteKey, callback: onToken, 'error-callback': onError, 'expired-callback': () => onToken('') }) }
    if (window.turnstile) render()
    else {
      const script = document.querySelector<HTMLScriptElement>('script[data-turnstile]') ?? document.createElement('script')
      if (!script.dataset.turnstile) { script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true; script.defer = true; script.dataset.turnstile = 'true'; document.head.appendChild(script) }
      script.addEventListener('load', render, { once: true })
      script.addEventListener('error', onError, { once: true })
    }
  }, [onError, onToken, siteKey])
  return <div className="turnstile" ref={element}/>
}

function LeadForm({ hasConsent, onRequestConsent }: { hasConsent: boolean; onRequestConsent: () => void }) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [token, setToken] = useState('')
  const [captchaError, setCaptchaError] = useState(false)
  const onToken = useCallback((value: string) => { setToken(value); setCaptchaError(false) }, [])
  const onCaptchaError = useCallback(() => setCaptchaError(true), [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'loading') return
    const form = new FormData(event.currentTarget)
    if (form.get('website')) { setState('success'); return }
    if (!supabase || !token) { setState('error'); return }
    setState('loading')
    const { error } = await supabase.functions.invoke('submit-application', { body: {
      name: String(form.get('name') ?? '').trim(), phone: String(form.get('phone') ?? '').trim(),
      from_address: String(form.get('from_address') ?? '').trim(), to_address: String(form.get('to_address') ?? '').trim(),
      moving_date: String(form.get('moving_date') ?? ''), volume: String(form.get('volume') ?? '') || null,
      comment: String(form.get('comment') ?? '').trim() || null, website: String(form.get('website') ?? ''), turnstile_token: token, privacy_consent: true,
    } })
    if (error) { if (import.meta.env.DEV) console.error('Application submission failed', error); window.turnstile?.reset(); setToken(''); setState('error'); return }
    setState('success')
  }
  if (state === 'success') return <div className="form-success"><Icon name="check" size={32}/><strong>Спасибо!</strong><p>Заявка отправлена. Мы свяжемся с вами, чтобы уточнить детали переезда.</p></div>
  if (!hasConsent) return <div className="consent-required"><strong>Для отправки заявки нужно согласие</strong><p>Мы используем ваши контактные данные только для расчёта и связи по переезду.</p><button type="button" className="button gold" onClick={onRequestConsent}>Ознакомиться с условиями</button></div>
  return <form className="lead-form" onSubmit={submit}><div className="form-grid"><label>Имя<input name="name" required placeholder="Ваше имя" /></label><label>Телефон<input name="phone" required type="tel" placeholder="+7 (___) ___-__-__" /></label><label>Откуда переезжаем<input name="from_address" required placeholder="Район или адрес" /></label><label>Куда переезжаем<input name="to_address" required placeholder="Район или адрес" /></label><label>Дата переезда<input name="moving_date" required type="date" /></label><label>Объём вещей<select name="volume" defaultValue=""><option value="" disabled>Выберите объём</option><option>Небольшой</option><option>Средний</option><option>Большой</option></select></label><label className="wide">Дополнительная информация<textarea name="comment" placeholder="Расскажите немного о вашем переезде" rows={3}/></label></div><input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /><Turnstile onToken={onToken} onError={onCaptchaError}/><button className="button gold submit" type="submit" disabled={state === 'loading' || !token}>{state === 'loading' ? 'Отправляем…' : <>Рассчитать стоимость <Icon name="arrow" size={18}/></>}</button>{(state === 'error' || captchaError) && <p className="form-error">Не удалось подтвердить или отправить заявку. Попробуйте ещё раз или напишите нам в WhatsApp.</p>}</form>
}

type ConsentChoice = 'accepted' | 'declined' | null
const CONSENT_STORAGE_KEY = 'irina-lyan-privacy-consent'

function PrivacyConsent({ onChoose }: { onChoose: (choice: Exclude<ConsentChoice, null>) => void }) {
  return <div className="privacy-backdrop" role="dialog" aria-modal="true" aria-labelledby="privacy-title"><section className="privacy-modal"><p className="eyebrow">ВАША КОНФИДЕНЦИАЛЬНОСТЬ</p><h2 id="privacy-title">Согласие на обработку персональных данных</h2><p>Чтобы рассчитать стоимость переезда и связаться с вами, мы обрабатываем данные из формы: имя, телефон, адреса и комментарий.</p><div className="privacy-note"><strong>Как используем данные</strong><ul><li>только для консультации и организации вашего переезда;</li><li>не передаём третьим лицам, кроме сотрудников, участвующих в обработке заявки;</li><li>храним в защищённой системе заявок.</li></ul></div><p className="privacy-small">Нажимая «Принимаю», вы даёте согласие на обработку этих данных для обратной связи по вашей заявке.</p><div className="privacy-actions"><button type="button" className="button gold" onClick={() => onChoose('accepted')}>Принимаю</button><button type="button" className="privacy-decline" onClick={() => onChoose('declined')}>Не принимаю</button></div></section></div>
}

function Rating() { return <div className="rating" aria-label="Рейтинг 5 из 5">{Array.from({ length: 5 }, (_, index) => <Icon key={index} name="star" size={14}/>)}</div> }

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  return <section className="faq section" id="faq"><div className="container faq-layout"><div className="faq-intro reveal reveal-left"><p className="eyebrow">ОТВЕТЫ НА ВОПРОСЫ</p><h2>Всё начинается с разговора</h2><p>Если не нашли ответ — напишите нам в WhatsApp. Подскажем, с чего начать именно ваш переезд.</p><a href={whatsappUrl} target="_blank" rel="noreferrer">Задать вопрос в WhatsApp <Icon name="arrow" size={18}/></a></div><div className="faq-list">{faqItems.map(([question, answer], index) => { const isOpen = openIndex === index; return <article className={`${isOpen ? 'is-open ' : ''}faq-item reveal reveal-up is-visible`} style={{ transitionDelay: `${Math.min(index, 4) * 55}ms` }} key={question}><h3><button type="button" aria-expanded={isOpen} onClick={() => setOpenIndex(isOpen ? null : index)}><span>{question}</span><span className="faq-toggle" aria-hidden="true">{isOpen ? '−' : '+'}</span></button></h3><div className="faq-answer" aria-hidden={!isOpen}><p>{answer}</p></div></article> })}</div></div></section>
}

function App() {
  const [consent, setConsent] = useState<ConsentChoice>(() => (localStorage.getItem(CONSENT_STORAGE_KEY) as ConsentChoice) || null)
  const [consentDialogOpen, setConsentDialogOpen] = useState(() => !localStorage.getItem(CONSENT_STORAGE_KEY))
  const chooseConsent = (choice: Exclude<ConsentChoice, null>) => { localStorage.setItem(CONSENT_STORAGE_KEY, choice); setConsent(choice); setConsentDialogOpen(false) }
  return <>{consentDialogOpen && <PrivacyConsent onChoose={chooseConsent}/>}<Navbar/><main id="top"><section className="hero"><div className="container hero-grid"><div className="hero-copy"><p className="eyebrow hero-enter hero-eyebrow">ОРГАНИЗАЦИЯ ПЕРЕЕЗДОВ</p><h1 className="hero-enter hero-heading">Переезд без стресса —<br/>это не мечта.<em>Его можно делегировать.</em></h1><p className="hero-sub hero-enter hero-description">Вы переезжаете.<br/>Мы делаем всё остальное.</p><div className="hero-flow hero-enter hero-flow-enter">Расхламим <b>→</b> Рассортируем <b>→</b> Упакуем <b>→</b> Перевезём <b>→</b> Распакуем</div><div className="hero-actions hero-enter hero-actions-enter"><Button href="#contacts">Хочу переезд под ключ <Icon name="arrow" size={18}/></Button><Button variant="outline" href={whatsappUrl}><Icon name="whatsapp" size={19}/> Написать в WhatsApp</Button></div></div><Placeholder label="IMAGE PLACEHOLDER · 4:5" className="hero-image hero-enter"/></div></section>

<section className="section about-irina" id="about"><div className="container about-irina-grid"><Placeholder label="PHOTO OF IRINA · PLACEHOLDER" className="irina-image reveal reveal-left"/><div className="about-irina-copy reveal reveal-right"><p className="eyebrow">ОБО МНЕ</p><h2>Я Ирина. И я знаю, как превратить переезд из хаоса в понятный процесс.</h2><p>Переезд — это всегда больше, чем коробки и транспорт. Это привычный дом, важные вещи, заботы семьи и желание начать новую главу спокойно.</p><p>Вместе с командой я помогаю пройти этот путь внимательно: от разбора вещей и плана до порядка в новом пространстве.</p><div className="irina-principles"><span><b>Бережно</b> к вещам и деталям</span><span><b>Понятно</b> на каждом этапе</span><span><b>Спокойно</b> для вас и вашей семьи</span></div></div></div></section>

<section className="section cream"><div className="container"><div className="section-head center reveal"><p className="eyebrow">ВОЗМОЖНО, ВЫ УЗНАЕТЕ СЕБЯ</p><h2>Переезд — это не просто<br/>перевезти коробки</h2><p>Знакомо?</p></div><div className="problem-grid">{problems.map((p,i) => <article className="problem-card reveal" key={p}><Icon name={(['heart','layers','pin','clock','home','chair','truck'] as IconName[])[i]}/><p>{p}</p></article>)}</div><p className="otherwise"><span>✦</span> А ведь можно иначе.</p></div></section>

<section className="section services" id="services"><div className="container"><div className="section-head center reveal reveal-up"><p className="eyebrow">ПЕРЕЕЗД ОТ А ДО Я</p><h2>Мы сделаем переезд за вас</h2><p>Я, Ирина Лян, и моя команда организуем ваш переезд под ключ.<br/>Мы берём на себя весь процесс — от первого разбора вещей до порядка в новом доме.</p></div><div className="service-grid">{services.map(([title,text,icon],i) => <article className="service-card reveal reveal-up" style={{ transitionDelay: `${(i % 4) * 75}ms` }} key={title}><Placeholder label={`SERVICE ${String(i + 1).padStart(2,'0')}`} /><div className="service-info"><span>0{i+1}</span><h3>{title}</h3><Icon name={icon as IconName}/><p>{text}</p></div></article>)}</div></div></section>

<section className="section process" id="process"><div className="container"><div className="section-head center reveal reveal-up"><p className="eyebrow">КАК ЭТО РАБОТАЕТ</p><h2>Шесть понятных шагов к новому дому</h2><p>Берём на себя организацию, а вы сохраняете время и спокойствие.</p></div><ol className="process-list">{processSteps.map(([number, title, description], index) => <li className="reveal reveal-scale" style={{ transitionDelay: `${(index % 3) * 75}ms` }} key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol></div></section>

<section className="section result"><div className="container result-wrap"><Placeholder label="CALM HOME · IMAGE PLACEHOLDER" className="result-image reveal reveal-scale"/><div className="result-copy reveal reveal-right"><p className="eyebrow">ПОСЛЕ ПЕРЕЕЗДА</p><h2>Вы получаете не просто переезд.<em>А готовый к жизни дом.</em></h2><ul>{[['Вещи уже рассортированы','layers'],['Мебель собрана','chair'],['Всё необходимое на своих местах','home'],['Вам остаётся только начать жить','heart']].map(([title, icon], index) => <li className="reveal reveal-up result-item" style={{ transitionDelay: `${120 + index * 75}ms` }} key={title}><Icon name={icon as IconName}/>{title}</li>)}</ul><p className="result-note">Вы приезжаете — а не разбираете горы коробок.</p></div></div></section>

<section className="section audience"><div className="container"><div className="section-head center"><p className="eyebrow">КОМУ ПОДОЙДЁТ</p><h2>Особенно удобно, если…</h2></div><div className="audience-row">{audiences.map(([t,i]) => <article key={t}><Icon name={i as IconName}/><p>{t}</p></article>)}</div></div></section>

<section className="section why cream" id="why"><div className="container"><div className="section-head center reveal reveal-up"><p className="eyebrow">НАШ ПОДХОД</p><h2>Почему нам доверяют</h2></div><div className="why-grid">{[['Не просто перевозим вещи','Мы думаем о том, как вы будете ими пользоваться после переезда.','heart'],['Всё организовано','От первого разбора вещей до последней коробки.','layers'],['Порядок сразу','Поможем организовать вещи в новом доме.','home'],['Экономия вашего времени','Вместо недель разборов вы получаете готовое пространство.','clock']].map(([t,d,i], index) => <article className="reveal reveal-up" style={{ transitionDelay: `${index * 70}ms` }} key={t}><Icon name={i as IconName}/><h3>{t}</h3><p>{d}</p></article>)}</div></div></section>

<section className="section emotional"><div className="container emotional-wrap"><div className="emotional-copy reveal reveal-left"><p className="eyebrow">ВАШ НОВЫЙ ДОМ</p><h2>Представьте свой переезд</h2><p>Не горы коробок.<br/>Не поиски зарядки среди десяти пакетов.<br/>Не вопрос: «А где вообще лежат полотенца?»</p><strong>А вы открываете шкаф — и всё необходимое уже на месте.</strong><small>Именно такой переезд мы хотим для вас организовать.</small></div><Placeholder label="ORDERED INTERIOR · IMAGE PLACEHOLDER" className="emotion-image reveal reveal-scale"/></div></section>

<section className="section reviews" id="reviews"><div className="container"><div className="section-head center reveal reveal-up"><p className="eyebrow">ОТЗЫВЫ КЛИЕНТОВ</p><h2>Когда переезд проходит спокойно</h2><p>Нам важно, чтобы в новом доме вы чувствовали себя дома с первого дня.</p></div><div className="reviews-grid">{reviews.map(([name, moveType, review, initials], index) => <article className="review-card reveal reveal-scale" style={{ transitionDelay: `${index * 70}ms` }} key={name}><Icon name="quote" size={28}/><Rating/><p className="review-text">{review}</p><div className="review-client"><span className="avatar" aria-hidden="true">{initials}</span><div><strong>{name}</strong><small>{moveType}</small></div></div></article>)}</div></div></section>

<section className="section final" id="contacts"><div className="container final-box"><div className="final-copy"><p className="eyebrow">ВАШ ПЕРЕЕЗД НАЧИНАЕТСЯ ЗДЕСЬ</p><h2>ПЕРЕЕЗД ПОД КЛЮЧ</h2><h3>Расхламим. Упакуем. Перевезём.<br/>Распакуем. Организуем.</h3><p>Оставьте заявку — мы свяжемся с вами и обсудим ваш переезд.</p></div><LeadForm hasConsent={consent === 'accepted'} onRequestConsent={() => setConsentDialogOpen(true)}/></div></section>

<FAQ/></main><footer><div className="container footer-row"><a className="brand" href="#top"><span>Ирина Лян</span><small>ПЕРЕЕЗД ПОД КЛЮЧ</small></a><p>© 2026 Переезд под ключ. Все права защищены.</p><button type="button" className="privacy-link" onClick={() => setConsentDialogOpen(true)}>Конфиденциальность</button><div className="footer-socials"><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Icon name="instagram"/> Instagram</a><a href={whatsappUrl} target="_blank" rel="noreferrer"><Icon name="whatsapp"/> +7 707 773 1752</a></div></div></footer></> }

export default App

function PublicAppWithReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('.reveal')
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) }
    }), { threshold: .12 })
    targets.forEach(target => observer.observe(target))
    return () => observer.disconnect()
  }, [])
  return <App />
}

createRoot(document.getElementById('root')!).render(window.location.pathname.startsWith('/admin') ? <AdminApp /> : <PublicAppWithReveal />)
