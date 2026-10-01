import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import LeaseCalculator from './LeaseCalculator.jsx'

// ── CONFIG ───────────────────────────────────────────────────
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || "keith"
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD
const GITHUB_USERNAME = "keith2929"
const CREDLY_USERNAME = "keith-tan.d370937e"
// relative by default: Netlify redirects /api/sheet/* to the sheet function,
// and vite.config.js proxies the same path to server.js in dev
const API = import.meta.env.VITE_API_URL || "/api/sheet"

const HEADERS = {
    about: ['bio', 'email', 'phone', 'linkedin', 'github'],
    experience: ['company', 'role', 'period', 'points', 'color'],
    skills: ['category', 'skills'],
    certifications: ['name', 'url'],
    projects: ['title', 'period', 'description', 'tags'],
    home: ['available_text', 'name', 'subtitle', 'description', 'badge1', 'badge2', 'badge3'],
    education: ['school', 'degree', 'major', 'relevant', 'period'],
    resume: ['url'],
    volunteer: ['organisation', 'role', 'period', 'points', 'color'],
}

const CARD_GRADIENTS = [
    'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
    'linear-gradient(135deg, #be123c 0%, #fb7185 100%)',
    'linear-gradient(135deg, #0e7490 0%, #22d3ee 100%)',
]

function getProjectIcon(tags = '') {
    const t = tags.toLowerCase()
    if (t.includes('machine learning') || t.includes('ml') || t.includes('ai')) return '🧠'
    if (t.includes('data') || t.includes('analytics') || t.includes('sql') || t.includes('power bi')) return '📊'
    if (t.includes('python') || t.includes('automation') || t.includes('bot')) return '🤖'
    if (t.includes('web') || t.includes('react') || t.includes('javascript')) return '💻'
    if (t.includes('accounting') || t.includes('tax') || t.includes('audit') || t.includes('finance')) return '📋'
    return '🔷'
}

async function readSheet(name) {
    const res = await fetch(`${API}/${name}`)
    return res.json()
}

async function writeSheet(name, rows) {
    const res = await fetch(`${API}/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers: HEADERS[name], rows }),
    })
    return res.ok
}

// ── UI COMPONENTS ────────────────────────────────────────────
function EditBtn({ onClick, label = 'item' }) {
    return <button onClick={onClick} style={s.editBtn} title={`Edit ${label}`} aria-label={`Edit ${label}`}><span aria-hidden="true">✏️</span></button>
}
function DeleteBtn({ onClick, label = 'item' }) {
    return <button onClick={onClick} style={{ ...s.editBtn, background: '#fef2f2', color: '#ef4444', borderColor: '#fecaca' }} title={`Delete ${label}`} aria-label={`Delete ${label}`}><span aria-hidden="true">🗑</span></button>
}
function AddBtn({ onClick, label = "Add" }) {
    return <button onClick={onClick} style={s.addBtn}>+ {label}</button>
}

function Modal({ title, onClose, onSave, saving, children }) {
    useEffect(() => {
        const onKey = e => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    return (
        <div style={s.overlay}>
            <div style={s.modal} role="dialog" aria-modal="true" aria-label={title}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: 18 }}>{title}</h3>
                    <button onClick={onClose} aria-label="Close dialog" style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer' }}>×</button>
                </div>
                {children}
                <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ ...s.btn, background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b' }}>Cancel</button>
                    <button onClick={onSave} disabled={saving} style={{ ...s.btn, background: '#1e40af', color: '#fff', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                        {saving ? 'Saving...' : 'Save to Google Sheets'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function Field({ label, value, onChange, multiline }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', color: '#64748b', fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
            {multiline
                ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={4} style={{ ...s.input, resize: 'vertical' }} />
                : <input value={value} onChange={e => onChange(e.target.value)} style={s.input} />
            }
        </div>
    )
}

function LoginPage({ onLogin, onClose }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const handleLogin = () => {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) onLogin()
        else setError('Incorrect username or password.')
    }
    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 40, width: 340, position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                <button onClick={onClose} aria-label="Close login" style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
                <h2 style={{ color: '#0f172a', marginBottom: 8, fontSize: 22 }}>Admin Login</h2>
                <p style={{ color: '#64748b', fontSize: 13, marginBottom: 28 }}>Sign in to edit your portfolio</p>
                <Field label="Username" value={username} onChange={setUsername} />
                <Field label="Password" value={password} onChange={v => { setPassword(v); setError('') }} />
                {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <button onClick={handleLogin} style={{ ...s.btn, width: '100%', background: '#1e40af', color: '#fff', fontWeight: 600, padding: '12px 0', fontSize: 15 }}>
                    Sign In
                </button>
            </div>
        </div>
    )
}

// ── TIMELINE ─────────────────────────────────────────────────
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function parseDate(str) {
    const s = (str || '').trim().toLowerCase()
    if (!s) return null
    if (/present|current|now|ongoing/.test(s)) {
        const now = new Date()
        return { year: now.getFullYear(), month: now.getMonth() + 1 }
    }
    const year = s.match(/\d{4}/)
    if (!year) return null
    const month = MONTHS.findIndex(m => s.includes(m))
    return { year: parseInt(year[0], 10), month: month === -1 ? 1 : month + 1 }
}

function parsePeriod(period) {
    const parts = (period || '').split(/\s*[–—-]\s*/)
    const end = parseDate(parts[1])
    // "Jan – May 2024" writes the year once, on the end half; let the start borrow it
    const start = parseDate(parts[0]) || (end && parseDate(`${parts[0]} ${end.year}`))
    return { start, end: end || start }
}

// months since year 0, so two dates compare as one number; null sorts last
const stamp = d => (d ? d.year * 12 + d.month : 0)

// "May 2025 – Aug 2025" → "4 mos" (inclusive of both end months, same as LinkedIn)
function durationLabel(start, end) {
    if (!start || !end) return ''
    const months = (end.year - start.year) * 12 + (end.month - start.month) + 1
    if (months < 1) return ''
    const yrs = Math.floor(months / 12)
    const mos = months % 12
    const bits = []
    if (yrs) bits.push(`${yrs} yr${yrs > 1 ? 's' : ''}`)
    if (mos) bits.push(`${mos} mo${mos > 1 ? 's' : ''}`)
    return bits.join(' ')
}

function useIsNarrow(breakpoint = 760) {
    const query = `(max-width: ${breakpoint - 1}px)`
    const subscribe = useCallback(onChange => {
        const mq = window.matchMedia(query)
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [query])
    return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}

function TimelineCard({ entry, titleKey, isAdmin, onEdit, onDelete }) {
    const { item, index, start, end } = entry
    const color = item.color || '#1e40af'
    const duration = durationLabel(start, end)
    const points = (item.points || '').split(';').map(p => p.trim()).filter(Boolean)

    return (
        <div
            style={{ background: '#fff', border: '1px solid #e2e8f0', borderLeft: `3px solid ${color}`, borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(15,23,42,0.09)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                    <p style={{ color, fontWeight: 700, fontSize: 14.5, margin: 0, lineHeight: 1.35 }}>{item[titleKey]}</p>
                    <p style={{ color: '#0f172a', fontSize: 13, margin: '3px 0 9px', fontWeight: 500 }}>{item.role}</p>
                </div>
                {isAdmin && (
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <EditBtn onClick={() => onEdit(item, index)} label={item[titleKey]} />
                        <DeleteBtn onClick={() => onDelete(index)} label={item[titleKey]} />
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: points.length ? 12 : 0 }}>
                <span style={s.badge}>{item.period}</span>
                {duration && <span style={{ ...s.badge, background: '#fff', color: '#94a3b8' }}>{duration}</span>}
            </div>
            {points.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {points.map((p, i) => (
                        <li key={i} style={{ color: '#475569', lineHeight: 1.65, fontSize: 13 }}>{p}</li>
                    ))}
                </ul>
            )}
        </div>
    )
}

// Flow-based timeline: cards size themselves, so a long entry can never overlap
// the next one. Centred + alternating on desktop, single left rail on mobile.
function Timeline({ items, titleKey = 'company', isAdmin, onEdit, onDelete, emptyText = 'Nothing here yet.' }) {
    const narrow = useIsNarrow()

    const entries = items
        .map((item, index) => ({ item, index, ...parsePeriod(item.period) }))
        // newest start first; when two roles ran concurrently the longer one sits on top
        .sort((a, b) => stamp(b.start) - stamp(a.start) || stamp(b.end) - stamp(a.end))

    if (entries.length === 0) return <p style={{ color: '#94a3b8', fontSize: 14 }}>{emptyText}</p>

    // group consecutive entries that start in the same year under one year marker
    const groups = []
    entries.forEach(entry => {
        const year = entry.start?.year ?? '—'
        const last = groups[groups.length - 1]
        if (last && last.year === year) last.entries.push(entry)
        else groups.push({ year, entries: [entry] })
    })

    const RAIL = 12
    let flip = 0

    return (
        <div style={{ position: 'relative' }}>
            <div style={{
                position: 'absolute', top: 4, bottom: 4, width: 2, zIndex: 0,
                left: narrow ? RAIL - 1 : '50%',
                transform: narrow ? 'none' : 'translateX(-50%)',
                background: 'linear-gradient(180deg, rgba(226,232,240,0) 0%, #e2e8f0 44px, #e2e8f0 calc(100% - 44px), rgba(226,232,240,0) 100%)',
            }} />

            {groups.map(group => (
                <div key={group.year}>
                    <div style={{ display: 'flex', justifyContent: narrow ? 'flex-start' : 'center', marginBottom: 18, position: 'relative', zIndex: 2 }}>
                        <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 999, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: 0.4 }}>
                            {group.year}
                        </span>
                    </div>

                    {group.entries.map(entry => {
                        const isLeft = !narrow && flip++ % 2 === 0
                        const color = entry.item.color || '#1e40af'
                        return (
                            <div key={entry.index} style={{
                                position: 'relative', marginBottom: 22, display: 'flex',
                                justifyContent: narrow || isLeft ? 'flex-start' : 'flex-end',
                                paddingLeft: narrow ? RAIL + 22 : 0,
                            }}>
                                <div style={{ width: narrow ? '100%' : 'calc(50% - 30px)', zIndex: 1 }}>
                                    <TimelineCard entry={entry} titleKey={titleKey} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} />
                                </div>
                                <div style={{
                                    position: 'absolute', top: 27, height: 2, background: '#e2e8f0', zIndex: 0,
                                    ...(narrow ? { left: RAIL + 1, width: 21 } : (isLeft ? { right: '50%', width: 30 } : { left: '50%', width: 30 })),
                                }} />
                                <div style={{
                                    position: 'absolute', top: 21, width: 13, height: 13, borderRadius: '50%',
                                    left: narrow ? RAIL - 6 : '50%',
                                    transform: narrow ? 'none' : 'translateX(-50%)',
                                    background: color, border: '2px solid #f8fafc', boxShadow: `0 0 0 3px ${color}22`, zIndex: 3,
                                }} />
                            </div>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}

// ── SPENDING MAP ─────────────────────────────────────────────
function SpendingMap({ receipts }) {
    const mapRef = useRef(null)
    const instanceRef = useRef(null)
    const [status, setStatus] = useState('idle') // idle | loading | done | error
    const [progress, setProgress] = useState('')
    const [debug, setDebug] = useState('')

    useEffect(() => {
        // Load Leaflet CSS + JS once
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link')
            link.id = 'leaflet-css'
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
            document.head.appendChild(link)
        }
        if (!document.getElementById('leaflet-js')) {
            const script = document.createElement('script')
            script.id = 'leaflet-js'
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
            document.head.appendChild(script)
        }
    }, [])

    useEffect(() => {
        if (!receipts.length || status !== 'idle') return

        const run = async () => {
            // Wait for Leaflet to load
            let attempts = 0
            while (!window.L && attempts < 30) {
                await new Promise(r => setTimeout(r, 200))
                attempts++
            }
            if (!window.L) { setStatus('error'); return }

            setStatus('loading')

            // Aggregate by location
            const locMap = {}
            receipts.forEach(r => {
                if (!r.location) return
                const key = r.location.trim()
                if (!locMap[key]) locMap[key] = { count: 0, total: 0, merchants: new Set() }
                locMap[key].count++
                locMap[key].total += parseFloat(r.total_amount) || 0
                if (r.merchant) locMap[key].merchants.add(r.merchant)
            })

            const uniqueLocs = Object.keys(locMap)
            setDebug(`${receipts.length} receipts · ${uniqueLocs.length} unique locations: ${uniqueLocs.slice(0, 5).join(', ')}${uniqueLocs.length > 5 ? '…' : ''}`)

            if (uniqueLocs.length === 0) { setStatus('done'); return }

            const geocoded = []

            setProgress(`Geocoding ${uniqueLocs.length} location${uniqueLocs.length !== 1 ? 's' : ''}…`)
            try {
                const res = await fetch('/.netlify/functions/geocode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(uniqueLocs),
                })
                const results = await res.json()
                results.forEach(r => {
                    if (r.lat && r.lng && locMap[r.loc]) {
                        geocoded.push({ loc: r.loc, lat: r.lat, lng: r.lng, ...locMap[r.loc], merchants: [...locMap[r.loc].merchants] })
                    }
                })
            } catch (e) { setDebug(prev => prev + ` · geocode error: ${e.message}`) }

            setDebug(prev => prev + ` · geocoded ${geocoded.length}/${uniqueLocs.length}`)
            setProgress('')

            if (!mapRef.current) return
            // Destroy previous instance
            if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null }

            const L = window.L
            const map = L.map(mapRef.current).setView([1.3521, 103.8198], 12)
            instanceRef.current = map

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map)

            const maxTotal = Math.max(...geocoded.map(g => g.total), 1)

            geocoded.forEach(g => {
                const radius = 14 + (g.total / maxTotal) * 36
                const circle = L.circleMarker([g.lat, g.lng], {
                    radius,
                    fillColor: '#1e40af',
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.75,
                })
                circle.bindPopup(`
                    <strong>${g.loc}</strong><br/>
                    ${g.merchants.slice(0, 3).join(', ')}<br/>
                    <span style="color:#1e40af;font-weight:600">$${g.total.toFixed(2)}</span>
                    &nbsp;·&nbsp;${g.count} receipt${g.count > 1 ? 's' : ''}
                `)
                circle.addTo(map)
            })

            setStatus('done')
        }

        run()
    }, [receipts])

    return (
        <div>
            {status === 'idle' && (
                <div style={{ textAlign: 'center', padding: 32 }}>
                    <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
                        Map geocodes your locations via OpenStreetMap — takes ~1 sec per unique place.
                    </p>
                    <button onClick={() => setStatus('idle')} style={{ display: 'none' }} />
                </div>
            )}
            {status === 'loading' && (
                <div style={{ padding: '16px 0', color: '#64748b', fontSize: 13 }}>
                    {progress || 'Geocoding locations...'}
                </div>
            )}
            {debug && <p style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'monospace', margin: '4px 0 8px' }}>{debug}</p>}
            {status === 'error' && <p style={{ color: '#ef4444', fontSize: 14 }}>Failed to load map.</p>}
            <div ref={mapRef} style={{ height: 380, borderRadius: 10, overflow: 'hidden', display: status === 'idle' ? 'none' : 'block', border: '1px solid #e2e8f0' }} />
        </div>
    )
}

// ── MAIN APP ─────────────────────────────────────────────────
export default function Portfolio() {
    const narrow = useIsNarrow()
    const [tab, setTab] = useState("home")
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [showLogin, setShowLogin] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState('')
    const [modal, setModal] = useState(null)
    const [repos, setRepos] = useState([])
    const [reposLoading, setReposLoading] = useState(true)
    const [credlyBadges, setCredlyBadges] = useState([])
    const [credlyLoading, setCredlyLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState('All')
    const [selectedProject, setSelectedProject] = useState(null)
    const [receipts, setReceipts] = useState([])
    const [receiptsLoading, setReceiptsLoading] = useState(false)
    const [receiptsError, setReceiptsError] = useState('')

    const [about, setAbout] = useState({})
    const [experience, setExperience] = useState([])
    const [skills, setSkills] = useState([])
    const [certifications, setCertifications] = useState([])
    const [projects, setProjects] = useState([])
    const [volunteer, setVolunteer] = useState([])
    const [homeData, setHomeData] = useState({
        available_text: "Open to full-time opportunities · Graduating Jun 2026",
        name: "Keith Tan",
        subtitle: "Accountancy & Data Analytics",
        description: "Recent SMU graduate with Big Four experience at EY and PwC. I turn financial data into decisions using Alteryx, Power BI, and SQL.",
        badge1: "EY Audit Intern", badge2: "PwC Digital Tax Intern", badge3: "Alteryx Certified",
    })
    const [education, setEducation] = useState({
        school: "Singapore Management University",
        degree: "Bachelor of Accountancy",
        major: "Double Major: Accountancy & Accounting Data Analytics",
        relevant: "Advanced Tax, Financial Accounting, Audit",
        period: "Sep 2022 – Jun 2026",
    })
    const [resumeUrl, setResumeUrl] = useState('')

    useEffect(() => {
        Promise.all([
            readSheet('about'), readSheet('experience'), readSheet('skills'),
            readSheet('certifications'), readSheet('projects'),
            readSheet('home'), readSheet('education'), readSheet('resume'),
            readSheet('volunteer'),
        ]).then(([a, exp, sk, cert, proj, hm, edu, res, vol]) => {
            if (a[0]) setAbout(a[0])
            if (exp.length) setExperience(exp)
            if (sk.length) setSkills(sk)
            if (cert.length) setCertifications(cert)
            if (proj.length) setProjects(proj)
            if (hm[0]) setHomeData(hm[0])
            if (edu[0]) setEducation(edu[0])
            if (res[0]?.url) setResumeUrl(res[0].url)
            if (vol?.length) setVolunteer(vol)
            setLoading(false)
        }).catch(() => setLoading(false))

        const loadRepos = async () => {
            setReposLoading(true)
            const sources = [
                `/.netlify/functions/github?username=${GITHUB_USERNAME}`,
                `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`,
            ]
            for (const url of sources) {
                try {
                    const res = await fetch(url)
                    if (!res.ok) continue
                    const data = await res.json()
                    // the GitHub API answers a rate-limit with an object, not an array
                    if (Array.isArray(data)) { setRepos(data); break }
                } catch { /* try the next source */ }
            }
            setReposLoading(false)
        }
        loadRepos()

        fetch(`/.netlify/functions/credly?username=${CREDLY_USERNAME}`)
            .then(r => r.json()).then(d => { setCredlyBadges(d.data || []); setCredlyLoading(false) })
            .catch(() => setCredlyLoading(false))
    }, [])

    useEffect(() => {
        if (!selectedProject) return
        const onKey = e => { if (e.key === 'Escape') setSelectedProject(null) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [selectedProject])

    const loadDashboard = () => {
        if (receipts.length > 0 || receiptsLoading) return
        setReceiptsLoading(true)
        setReceiptsError('')
        fetch('/.netlify/functions/supabase')
            .then(r => r.json())
            .then(d => {
                if (d.error) { setReceiptsError(d.error); setReceiptsLoading(false); return }
                setReceipts(Array.isArray(d) ? d : [])
                setReceiptsLoading(false)
            })
            .catch(e => { setReceiptsError(e.message); setReceiptsLoading(false) })
    }

    const showToast = (ok) => {
        setSaveMsg(ok ? '✅ Saved to Google Sheets!' : '❌ Save failed')
        setTimeout(() => setSaveMsg(''), 3000)
    }

    const saveModal = async () => {
        const { type, data, index } = modal
        setSaving(true)
        let ok = false

        if (type === 'about') { const u = { ...about, ...data }; setAbout(u); ok = await writeSheet('about', [u]) }
        if (type === 'homeData') { const u = { ...homeData, ...data }; setHomeData(u); ok = await writeSheet('home', [u]) }
        if (type === 'education') { const u = { ...education, ...data }; setEducation(u); ok = await writeSheet('education', [u]) }
        if (type === 'experience') { const u = [...experience]; index === -1 ? u.push(data) : u[index] = data; setExperience(u); ok = await writeSheet('experience', u) }
        if (type === 'skill') { const u = [...skills]; index === -1 ? u.push(data) : u[index] = data; setSkills(u); ok = await writeSheet('skills', u) }
        if (type === 'certification') { const u = [...certifications]; index === -1 ? u.push(data) : u[index] = data; setCertifications(u); ok = await writeSheet('certifications', u) }
        if (type === 'project') { const u = [...projects]; index === -1 ? u.push(data) : u[index] = data; setProjects(u); ok = await writeSheet('projects', u) }
        if (type === 'volunteer') { const u = [...volunteer]; index === -1 ? u.push(data) : u[index] = data; setVolunteer(u); ok = await writeSheet('volunteer', u) }
        if (type === 'resume') { setResumeUrl(data.url); ok = await writeSheet('resume', [{ url: data.url }]) }

        setSaving(false)
        setModal(null)
        showToast(ok)
    }

    const deleteItem = async (type, index) => {
        if (!confirm('Delete this item?')) return
        const map = { experience: [experience, setExperience], skill: [skills, setSkills], certification: [certifications, setCertifications], project: [projects, setProjects], volunteer: [volunteer, setVolunteer] }
        const sheetMap = { experience: 'experience', skill: 'skills', certification: 'certifications', project: 'projects', volunteer: 'volunteer' }
        const [arr, setter] = map[type]
        const updated = arr.filter((_, i) => i !== index)
        setter(updated)
        const ok = await writeSheet(sheetMap[type], updated)
        showToast(ok)
    }

    const skillsByCategory = skills.reduce((acc, row) => {
        if (row.category) acc[row.category] = (row.skills || '').split(',').map(s => s.trim())
        return acc
    }, {})

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: 15 }}>Loading portfolio...</p>
        </div>
    )

    if (showLogin) return <LoginPage onLogin={() => { setIsAdmin(true); setShowLogin(false) }} onClose={() => setShowLogin(false)} />

    const navItems = ["home", "about", "experience", "skills", "projects", "resume", ...(isAdmin ? ["dashboard"] : [])]

    return (
        <div style={s.page}>
            {/* MODAL */}
            {modal && (
                <Modal title={modal.title} onClose={() => setModal(null)} onSave={saveModal} saving={saving}>
                    {modal.type === 'about' && <>
                        <Field label="Bio" value={modal.data.bio || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, bio: v } }))} multiline />
                        <Field label="Email" value={modal.data.email || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, email: v } }))} />
                        <Field label="Phone" value={modal.data.phone || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, phone: v } }))} />
                        <Field label="LinkedIn (without https://)" value={modal.data.linkedin || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, linkedin: v } }))} />
                        <Field label="GitHub username" value={modal.data.github || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, github: v } }))} />
                    </>}
                    {modal.type === 'homeData' && <>
                        <Field label="Name" value={modal.data.name || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, name: v } }))} />
                        <Field label="Subtitle" value={modal.data.subtitle || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, subtitle: v } }))} />
                        <Field label="Description" value={modal.data.description || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, description: v } }))} multiline />
                        <Field label="Availability banner" value={modal.data.available_text || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, available_text: v } }))} />
                        <Field label="Badge 1" value={modal.data.badge1 || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, badge1: v } }))} />
                        <Field label="Badge 2" value={modal.data.badge2 || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, badge2: v } }))} />
                        <Field label="Badge 3" value={modal.data.badge3 || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, badge3: v } }))} />
                    </>}
                    {modal.type === 'education' && <>
                        <Field label="School" value={modal.data.school || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, school: v } }))} />
                        <Field label="Degree" value={modal.data.degree || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, degree: v } }))} />
                        <Field label="Major" value={modal.data.major || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, major: v } }))} />
                        <Field label="Relevant coursework" value={modal.data.relevant || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, relevant: v } }))} />
                        <Field label="Period" value={modal.data.period || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, period: v } }))} />
                    </>}
                    {modal.type === 'experience' && <>
                        <Field label="Company" value={modal.data.company || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, company: v } }))} />
                        <Field label="Role" value={modal.data.role || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, role: v } }))} />
                        <Field label="Period" value={modal.data.period || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, period: v } }))} />
                        <Field label="Bullet points (separate with ;)" value={modal.data.points || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, points: v } }))} multiline />
                        <Field label="Colour (hex e.g. #1e40af)" value={modal.data.color || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, color: v } }))} />
                    </>}
                    {modal.type === 'volunteer' && <>
                        <Field label="Organisation" value={modal.data.organisation || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, organisation: v } }))} />
                        <Field label="Role" value={modal.data.role || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, role: v } }))} />
                        <Field label="Period" value={modal.data.period || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, period: v } }))} />
                        <Field label="Bullet points (separate with ;)" value={modal.data.points || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, points: v } }))} multiline />
                        <Field label="Colour (hex e.g. #10b981)" value={modal.data.color || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, color: v } }))} />
                    </>}
                    {modal.type === 'skill' && <>
                        <Field label="Category" value={modal.data.category || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, category: v } }))} />
                        <Field label="Skills (comma separated)" value={modal.data.skills || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, skills: v } }))} multiline />
                    </>}
                    {modal.type === 'certification' && <>
                        <Field label="Certification name" value={modal.data.name || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, name: v } }))} />
                        <Field label="Credly badge URL" value={modal.data.url || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, url: v } }))} />
                    </>}
                    {modal.type === 'project' && <>
                        <Field label="Title" value={modal.data.title || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, title: v } }))} />
                        <Field label="Period" value={modal.data.period || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, period: v } }))} />
                        <Field label="Description" value={modal.data.description || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, description: v } }))} multiline />
                        <Field label="Tags (comma separated)" value={modal.data.tags || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, tags: v } }))} />
                    </>}
                    {modal.type === 'resume' && <>
                        <Field label="Google Drive URL" value={modal.data.url || ''} onChange={v => setModal(m => ({ ...m, data: { ...m.data, url: v } }))} />
                        <p style={{ color: '#94a3b8', fontSize: 12, marginTop: -8 }}>Paste your Google Drive share link here</p>
                    </>}
                </Modal>
            )}

            {/* TOAST */}
            {saveMsg && (
                <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 20px', color: '#0f172a', fontSize: 14, zIndex: 300, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {saveMsg}
                </div>
            )}

            {/* NAVBAR */}
            <nav style={{ ...s.nav, padding: narrow ? '0 12px' : '0 24px', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 18, color: '#1e40af', letterSpacing: '-0.5px', flexShrink: 0 }}>KT</span>
                <div className="nav-scroll" style={{ display: 'flex', gap: 4, overflowX: 'auto', flex: 1, justifyContent: narrow ? 'flex-start' : 'center' }}>
                    {navItems.map(item => (
                        <button key={item} onClick={() => { setTab(item); if (item === 'dashboard') loadDashboard() }} aria-current={tab === item ? 'page' : undefined} style={{
                            ...s.navBtn,
                            padding: narrow ? '17px 8px 15px' : '18px 10px 16px',
                            fontSize: narrow ? 13 : 14,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            color: tab === item ? '#1e40af' : '#64748b',
                            borderBottom: tab === item ? '2px solid #1e40af' : '2px solid transparent',
                            fontWeight: tab === item ? 600 : 400,
                        }}>
                            {item.charAt(0).toUpperCase() + item.slice(1)}
                        </button>
                    ))}
                </div>
                <div style={{ flexShrink: 0 }}>
                    {isAdmin
                        ? <button onClick={() => setIsAdmin(false)} style={{ ...s.btn, background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 13, padding: '6px 14px' }}>Log out</button>
                        : <button onClick={() => setShowLogin(true)} style={{ ...s.btn, background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 13, padding: '6px 14px' }}>Admin</button>
                    }
                </div>
            </nav>

            {/* HOME */}
            {tab === "home" && (
                <section style={s.hero}>
                    {isAdmin && <div style={{ position: 'absolute', top: 70, right: 24 }}>
                        <EditBtn onClick={() => setModal({ type: 'homeData', title: 'Edit Home Page', data: { ...homeData } })} label="home page" />
                    </div>}
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '6px 16px', marginBottom: 24 }}>
                        <span style={{ color: '#1d4ed8', fontSize: 13, fontWeight: 500 }}><span aria-hidden="true">🟢</span> {homeData.available_text}</span>
                    </div>
                    <h1 style={{ fontSize: 60, margin: '0 0 12px', color: '#0f172a', fontWeight: 700, letterSpacing: '-2px', textAlign: 'center' }}>{homeData.name}</h1>
                    <p style={{ fontSize: 20, color: '#1e40af', marginBottom: 16, fontWeight: 600, letterSpacing: '-0.3px' }}>{homeData.subtitle}</p>
                    <p style={{ color: '#64748b', maxWidth: 520, marginBottom: 28, textAlign: 'center', lineHeight: 1.8, fontSize: 15 }}>{homeData.description}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
                        {[homeData.badge1, homeData.badge2, homeData.badge3].filter(Boolean).map(badge => (
                            <span key={badge} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 12px', fontSize: 13 }}>{badge}</span>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button onClick={() => setTab("experience")} style={{ ...s.btn, background: '#1e40af', color: '#fff', fontWeight: 600 }}>View Experience</button>
                        <button onClick={() => setTab("resume")} style={{ ...s.btn, background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>Download Resume</button>
                        {about.linkedin && <a href={`https://${about.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ ...s.btn, background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>LinkedIn ↗</a>}
                    </div>
                </section>
            )}

            <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 60px' }}>

                {/* ABOUT */}
                {tab === "about" && (
                    <div>
                        <div style={s.card}>
                            <div style={s.cardHeader}>
                                <h2 style={s.h2}>About Me</h2>
                                {isAdmin && <EditBtn onClick={() => setModal({ type: 'about', title: 'Edit About', data: { ...about } })} label="about" />}
                            </div>
                            <p style={{ color: '#475569', lineHeight: 1.8, margin: 0 }}>{about.bio}</p>
                        </div>
                        <div style={s.card}>
                            <div style={s.cardHeader}>
                                <h2 style={s.h2}>Education</h2>
                                {isAdmin && <EditBtn onClick={() => setModal({ type: 'education', title: 'Edit Education', data: { ...education } })} label="education" />}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                <div>
                                    <p style={{ color: '#0f172a', fontWeight: 600, fontSize: 17, margin: 0 }}>{education.school}</p>
                                    <p style={{ color: '#1e40af', marginTop: 4, marginBottom: 0, fontWeight: 500 }}>{education.degree}</p>
                                    <p style={{ color: '#64748b', fontSize: 13, marginTop: 2, marginBottom: 0 }}>{education.major}</p>
                                    <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 8, marginBottom: 0 }}>Relevant: {education.relevant}</p>
                                </div>
                                <span style={{ ...s.badge, alignSelf: 'flex-start' }}>{education.period}</span>
                            </div>
                        </div>
                        <div style={s.card}>
                            <div style={s.cardHeader}>
                                <h2 style={s.h2}>Contact</h2>
                                {isAdmin && <EditBtn onClick={() => setModal({ type: 'about', title: 'Edit Contact', data: { ...about } })} label="contact details" />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {about.email && <a href={`mailto:${about.email}`} style={s.contactLink}><span aria-hidden="true">✉ </span> {about.email}</a>}
                                {about.phone && <a href={`tel:${about.phone}`} style={s.contactLink}><span aria-hidden="true">📱 </span> {about.phone}</a>}
                                {about.linkedin && <a href={`https://${about.linkedin}`} target="_blank" rel="noopener noreferrer" style={s.contactLink}><span aria-hidden="true">💼 </span> {about.linkedin}</a>}
                                {about.github && <a href={`https://github.com/${about.github}`} target="_blank" rel="noopener noreferrer" style={s.contactLink}><span aria-hidden="true">🐙 </span> github.com/{about.github}</a>}
                            </div>
                        </div>
                    </div>
                )}

                {/* EXPERIENCE */}
                {tab === "experience" && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24, marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <h2 style={{ ...s.h2, margin: 0 }}>Work Experience</h2>
                                <p style={{ color: '#94a3b8', fontSize: 13, margin: '6px 0 0' }}>Big Four audit and tax-technology internships</p>
                            </div>
                            {isAdmin && <AddBtn onClick={() => setModal({ type: 'experience', title: 'Add Experience', data: { company: '', role: '', period: '', points: '', color: '#1e40af' }, index: -1 })} label="Add Job" />}
                        </div>

                        <Timeline
                            items={experience}
                            titleKey="company"
                            isAdmin={isAdmin}
                            onEdit={(item, index) => setModal({ type: 'experience', title: 'Edit Experience', data: { ...item }, index })}
                            onDelete={index => deleteItem('experience', index)}
                            emptyText="No roles added yet."
                        />

                        {(volunteer.length > 0 || isAdmin) && (
                            <div style={{ marginTop: 44, borderTop: '1px solid #e2e8f0', paddingTop: 32 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
                                    <div>
                                        <h2 style={{ ...s.h2, margin: 0 }}>Volunteer &amp; Community</h2>
                                        <p style={{ color: '#94a3b8', fontSize: 13, margin: '6px 0 0' }}>Governance, transparency and community work</p>
                                    </div>
                                    {isAdmin && <AddBtn onClick={() => setModal({ type: 'volunteer', title: 'Add Volunteer Role', data: { organisation: '', role: '', period: '', points: '', color: '#10b981' }, index: -1 })} label="Add Role" />}
                                </div>

                                <Timeline
                                    items={volunteer}
                                    titleKey="organisation"
                                    isAdmin={isAdmin}
                                    onEdit={(item, index) => setModal({ type: 'volunteer', title: 'Edit Volunteer Role', data: { ...item }, index })}
                                    onDelete={index => deleteItem('volunteer', index)}
                                    emptyText="No volunteer roles added yet."
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* SKILLS */}
                {tab === "skills" && (
                    <div>
                        <div style={{ ...s.card, marginTop: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ ...s.h2, margin: 0 }}>Skills</h2>
                                {isAdmin && <AddBtn onClick={() => setModal({ type: 'skill', title: 'Add Skill Category', data: { category: '', skills: '' }, index: -1 })} label="Add Category" />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {Object.entries(skillsByCategory).map(([category, items], idx) => (
                                    <div key={category}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                            <p style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, margin: 0, fontWeight: 600 }}>{category}</p>
                                            {isAdmin && <>
                                                <EditBtn onClick={() => setModal({ type: 'skill', title: 'Edit Skills', data: { ...skills[idx] }, index: idx })} label={category} />
                                                <DeleteBtn onClick={() => deleteItem('skill', idx)} label={category} />
                                            </>}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {items.map(skill => <span key={skill} style={s.tag}>{skill}</span>)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* CREDLY BADGES */}
                        <div style={s.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <div>
                                    <h2 style={{ ...s.h2, margin: 0 }}>Credly Badges</h2>
                                    <p style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 0' }}>Verified credentials from Credly</p>
                                </div>
                                <a href={`https://www.credly.com/users/${CREDLY_USERNAME}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>View profile ↗</a>
                            </div>
                            {credlyLoading && <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading badges...</p>}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
                                {credlyBadges.map(badge => (
                                    <a key={badge.id} href={`https://www.credly.com/badges/${badge.id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', transition: 'box-shadow 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(30,64,175,0.1)'}
                                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                                        <img src={badge.image_url} alt={badge.badge_template?.name} style={{ width: 80, height: 80, objectFit: 'contain' }} />
                                        <p style={{ color: '#0f172a', fontSize: 12, fontWeight: 600, textAlign: 'center', margin: 0, lineHeight: 1.4 }}>{badge.badge_template?.name}</p>
                                        <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>{badge.issuer?.entities?.[0]?.entity?.name || 'Credly'}</p>
                                        <p style={{ color: '#cbd5e1', fontSize: 10, margin: 0 }}>{badge.issued_at_date?.slice(0, 7)}</p>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* OTHER CERTIFICATIONS */}
                        <div style={s.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <div>
                                    <h2 style={{ ...s.h2, margin: 0 }}>Other Certifications</h2>
                                    <p style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 0' }}>Certifications outside of Credly</p>
                                </div>
                                {isAdmin && <AddBtn onClick={() => setModal({ type: 'certification', title: 'Add Certification', data: { name: '', url: '' }, index: -1 })} label="Add" />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {certifications.map((cert, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                        <span style={{ color: '#1e40af', flexShrink: 0, fontWeight: 700 }}>✓</span>
                                        {cert.url
                                            ? <a href={cert.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', fontSize: 14, flex: 1, textDecoration: 'none', fontWeight: 500 }}>{cert.name} ↗</a>
                                            : <span style={{ color: '#0f172a', fontSize: 14, flex: 1 }}>{cert.name}</span>
                                        }
                                        {isAdmin && <div style={{ display: 'flex', gap: 4 }}>
                                            <EditBtn onClick={() => setModal({ type: 'certification', title: 'Edit Certification', data: { ...cert }, index: idx })} label={cert.name} />
                                            <DeleteBtn onClick={() => deleteItem('certification', idx)} label={cert.name} />
                                        </div>}
                                    </div>
                                ))}
                                {certifications.length === 0 && !isAdmin && <p style={{ color: '#94a3b8', fontSize: 14 }}>None added yet.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* PROJECTS */}
                {tab === "projects" && (() => {
                    const allTags = [...new Set(projects.flatMap(p => (p.tags || '').split(',').map(t => t.trim()).filter(Boolean)))]
                    const filtered = activeFilter === 'All' ? projects : projects.filter(p => (p.tags || '').split(',').map(t => t.trim()).includes(activeFilter))
                    const showGitHub = activeFilter === 'All' || activeFilter === 'GitHub'

                    return (
                        <div>
                            {/* Dark hero banner */}
                            <div style={{ margin: '0 -24px', padding: '52px 24px 48px', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', textAlign: 'center', marginBottom: 36 }}>
                                <h2 style={{ color: '#fff', fontSize: 34, margin: '0 0 12px', fontWeight: 700, letterSpacing: '-0.5px' }}>Projects & Work</h2>
                                <p style={{ color: '#94a3b8', fontSize: 15, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
                                    Data analytics, accounting automation, and software projects I've built or contributed to.
                                </p>
                            </div>

                            {/* Filter pills + admin add */}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32, justifyContent: 'center', alignItems: 'center' }}>
                                {['All', ...allTags, 'GitHub'].map(filter => (
                                    <button key={filter} onClick={() => setActiveFilter(filter)} style={{
                                        padding: '8px 20px', borderRadius: 999, border: '1px solid',
                                        borderColor: activeFilter === filter ? '#1e40af' : '#e2e8f0',
                                        background: activeFilter === filter ? '#1e40af' : '#fff',
                                        color: activeFilter === filter ? '#fff' : '#475569',
                                        cursor: 'pointer', fontSize: 14,
                                        fontWeight: activeFilter === filter ? 600 : 400,
                                    }}>{filter}</button>
                                ))}
                                {isAdmin && <AddBtn onClick={() => setModal({ type: 'project', title: 'Add Project', data: { title: '', period: '', description: '', tags: '' }, index: -1 })} label="Add Project" />}
                            </div>

                            {/* Project cards grid */}
                            {filtered.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24, marginBottom: 40 }}>
                                    {filtered.map((p, idx) => (
                                        <div key={idx} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer' }}
                                            onClick={() => setSelectedProject({ ...p, _idx: projects.indexOf(p) })}>
                                            {/* Gradient top */}
                                            <div style={{ height: 110, background: CARD_GRADIENTS[idx % CARD_GRADIENTS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, position: 'relative' }}>
                                                <span aria-hidden="true">{getProjectIcon(p.tags)}</span>
                                                {isAdmin && (
                                                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                                                        <EditBtn onClick={() => setModal({ type: 'project', title: 'Edit Project', data: { ...p }, index: projects.indexOf(p) })} label={p.title} />
                                                        <DeleteBtn onClick={() => deleteItem('project', projects.indexOf(p))} label={p.title} />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Card body */}
                                            <div style={{ padding: 20 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                                                    <p style={{ color: '#0f172a', fontWeight: 600, fontSize: 15, margin: 0 }}>{p.title}</p>
                                                    <span style={{ ...s.badge, flexShrink: 0 }}>{p.period}</span>
                                                </div>
                                                <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.65, margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                    {(p.tags || '').split(',').map(t => t.trim()).filter(Boolean).map(t => (
                                                        <span key={t} style={{ ...s.tag, fontSize: 11, padding: '2px 8px' }}>{t}</span>
                                                    ))}
                                                </div>
                                                <p style={{ color: '#1e40af', fontSize: 13, fontWeight: 500, margin: '14px 0 0' }}>Learn more →</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* GitHub repos */}
                            {showGitHub && (
                                <div>
                                    <h3 style={{ ...s.h2, fontSize: 18, marginBottom: 16 }}>GitHub Repositories</h3>
                                    {reposLoading && <p style={{ color: '#94a3b8' }}>Loading repositories...</p>}
                                    <div style={s.grid2}>
                                        {repos.map(repo => (
                                            <div key={repo.id} style={{ ...s.card, marginTop: 0 }}>
                                                <p style={{ fontWeight: 600, fontSize: 15, margin: '0 0 6px', color: '#0f172a' }}>{repo.name}</p>
                                                <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16, lineHeight: 1.6, flex: 1 }}>{repo.description || 'No description provided'}</p>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{repo.language}</span>
                                                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                                        {repo.name === 'lease-calc' && (
                                                            <button onClick={() => setTab('leaseCalc')} style={{ background: 'none', border: 'none', padding: 0, color: '#1e40af', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Try it out →</button>
                                                        )}
                                                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', fontSize: 13, fontWeight: 500 }}>View Code →</a>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Project detail modal */}
                            {selectedProject && (
                                <div style={s.overlay} onClick={() => setSelectedProject(null)}>
                                    <div style={{ ...s.modal, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                                        <div style={{ height: 140, background: CARD_GRADIENTS[selectedProject._idx % CARD_GRADIENTS.length], borderRadius: '12px 12px 0 0', margin: '-28px -28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                                            <span aria-hidden="true">{getProjectIcon(selectedProject.tags)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                                            <h3 style={{ margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 700 }}>{selectedProject.title}</h3>
                                            <button onClick={() => setSelectedProject(null)} aria-label="Close project details" style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer', flexShrink: 0 }}>×</button>
                                        </div>
                                        <span style={s.badge}>{selectedProject.period}</span>
                                        <p style={{ color: '#475569', lineHeight: 1.8, fontSize: 14, margin: '16px 0' }}>{selectedProject.description}</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {(selectedProject.tags || '').split(',').map(t => t.trim()).filter(Boolean).map(t => (
                                                <span key={t} style={s.tag}>{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })()}

                {/* DASHBOARD */}
                {tab === "dashboard" && isAdmin && (() => {
                    if (receiptsLoading) return <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>Loading receipts...</div>
                    if (receiptsError) return (
                        <div style={{ ...s.card, marginTop: 24, textAlign: 'center', padding: 40 }}>
                            <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 8 }}>Failed to load data</p>
                            <p style={{ color: '#94a3b8', fontSize: 13, fontFamily: 'monospace' }}>{receiptsError}</p>
                            <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 16 }}>Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in Netlify environment variables.</p>
                        </div>
                    )

                    // Aggregate data
                    const parseTotal = v => parseFloat(v) || 0

                    // Monthly totals
                    const monthly = {}
                    receipts.forEach(r => {
                        if (!r.receipt_date) return
                        const month = r.receipt_date.slice(0, 7)
                        monthly[month] = (monthly[month] || 0) + parseTotal(r.total_amount)
                    })
                    const monthlyEntries = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
                    const maxMonthly = Math.max(...monthlyEntries.map(e => e[1]), 1)

                    // Top merchants
                    const merchants = {}
                    receipts.forEach(r => {
                        if (!r.merchant) return
                        merchants[r.merchant] = (merchants[r.merchant] || 0) + parseTotal(r.total_amount)
                    })
                    const topMerchants = Object.entries(merchants).sort((a, b) => b[1] - a[1]).slice(0, 8)
                    const maxMerchant = Math.max(...topMerchants.map(e => e[1]), 1)

                    // Payment methods
                    const payMethods = {}
                    receipts.forEach(r => {
                        const pm = r.payment_method || 'Unknown'
                        payMethods[pm] = (payMethods[pm] || 0) + parseTotal(r.total_amount)
                    })
                    const totalSpend = Object.values(payMethods).reduce((a, b) => a + b, 0)
                    const pmEntries = Object.entries(payMethods).sort((a, b) => b[1] - a[1])

                    const PM_COLORS = ['#1e40af', '#065f46', '#7c3aed', '#b45309', '#be123c', '#0e7490']

                    // Recent receipts
                    const recent = receipts.slice(0, 50)

                    const fmt = n => `$${parseTotal(n).toFixed(2)}`
                    const fmtMonth = m => {
                        const [y, mo] = m.split('-')
                        return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mo) - 1]} ${y}`
                    }

                    return (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
                                <h2 style={{ ...s.h2, margin: 0 }}>Spending Dashboard</h2>
                                <button onClick={() => { setReceipts([]); loadDashboard() }} style={{ ...s.addBtn }}>↻ Refresh</button>
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 0, marginBottom: 24 }}>
                                {receipts.length} receipts · Total {fmt(totalSpend)}
                            </p>

                            {/* KPI row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                                {[
                                    { label: 'Total Spend', value: fmt(totalSpend) },
                                    { label: 'Receipts', value: receipts.length },
                                    { label: 'Avg per Receipt', value: receipts.length ? fmt(totalSpend / receipts.length) : '$0' },
                                    { label: 'Unique Merchants', value: Object.keys(merchants).length },
                                ].map(k => (
                                    <div key={k.label} style={{ ...s.card, marginTop: 0, padding: 20 }}>
                                        <p style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>{k.label}</p>
                                        <p style={{ color: '#0f172a', fontSize: 24, fontWeight: 700, margin: 0 }}>{k.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Monthly spend chart */}
                            <div style={{ ...s.card, marginTop: 0 }}>
                                <h3 style={{ ...s.h2, fontSize: 16 }}>Monthly Spend</h3>
                                {monthlyEntries.length === 0
                                    ? <p style={{ color: '#94a3b8', fontSize: 14 }}>No data yet.</p>
                                    : <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, paddingBottom: 28, position: 'relative' }}>
                                        {monthlyEntries.map(([month, val]) => (
                                            <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                                                <span style={{ color: '#64748b', fontSize: 10, fontWeight: 600 }}>{fmt(val)}</span>
                                                <div style={{ width: '100%', background: '#1e40af', borderRadius: '4px 4px 0 0', height: `${(val / maxMonthly) * 90}px`, minHeight: 2, transition: 'height 0.3s' }} />
                                                <span style={{ color: '#94a3b8', fontSize: 9, whiteSpace: 'nowrap', transform: 'rotate(-35deg)', transformOrigin: 'top center', marginTop: 6 }}>{fmtMonth(month)}</span>
                                            </div>
                                        ))}
                                    </div>
                                }
                            </div>

                            {/* Merchants + Payment methods row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                                {/* Top merchants */}
                                <div style={{ ...s.card, marginTop: 0 }}>
                                    <h3 style={{ ...s.h2, fontSize: 16 }}>Top Merchants</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {topMerchants.map(([name, val]) => (
                                            <div key={name}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <span style={{ color: '#0f172a', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{name}</span>
                                                    <span style={{ color: '#64748b', fontSize: 12 }}>{fmt(val)}</span>
                                                </div>
                                                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                                                    <div style={{ height: 6, background: '#1e40af', borderRadius: 3, width: `${(val / maxMerchant) * 100}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment methods */}
                                <div style={{ ...s.card, marginTop: 0 }}>
                                    <h3 style={{ ...s.h2, fontSize: 16 }}>By Payment Method</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {pmEntries.map(([pm, val], i) => (
                                            <div key={pm}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <span style={{ color: '#0f172a', fontSize: 13, fontWeight: 500 }}>{pm}</span>
                                                    <span style={{ color: '#64748b', fontSize: 12 }}>{totalSpend ? `${((val / totalSpend) * 100).toFixed(1)}%` : ''} · {fmt(val)}</span>
                                                </div>
                                                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4 }}>
                                                    <div style={{ height: 8, background: PM_COLORS[i % PM_COLORS.length], borderRadius: 4, width: totalSpend ? `${(val / totalSpend) * 100}%` : '0%' }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Locations map */}
                            <div style={{ ...s.card, marginTop: 16 }}>
                                <h3 style={{ ...s.h2, fontSize: 16, marginBottom: 4 }}>Spending Map</h3>
                                <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 0, marginBottom: 16 }}>
                                    Bubble size = total spend at that location
                                </p>
                                <SpendingMap receipts={receipts} />
                            </div>

                            {/* Recent receipts table */}
                            <div style={{ ...s.card, marginTop: 16 }}>
                                <h3 style={{ ...s.h2, fontSize: 16, marginBottom: 16 }}>Recent Receipts</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                                {['Date', 'Merchant', 'Location', 'Payment', 'Total'].map(h => (
                                                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recent.map((r, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <td style={{ padding: '9px 10px', color: '#64748b', whiteSpace: 'nowrap' }}>{r.receipt_date?.slice(0, 10) || '—'}</td>
                                                    <td style={{ padding: '9px 10px', color: '#0f172a', fontWeight: 500 }}>{r.merchant || '—'}</td>
                                                    <td style={{ padding: '9px 10px', color: '#64748b' }}>{r.location || '—'}</td>
                                                    <td style={{ padding: '9px 10px', color: '#64748b' }}>{r.payment_method || '—'}</td>
                                                    <td style={{ padding: '9px 10px', color: '#0f172a', fontWeight: 600, textAlign: 'right' }}>{fmt(r.total_amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {recent.length === 0 && <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: 32 }}>No receipts found.</p>}
                                </div>
                            </div>
                        </div>
                    )
                })()}

                {/* RESUME */}
                {tab === "resume" && (
                    <div style={{ ...s.card, marginTop: 24, textAlign: 'center', padding: 56 }}>
                        <div style={{ width: 64, height: 64, background: '#eff6ff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }} aria-hidden="true">📄</div>
                        <h2 style={{ ...s.h2, textAlign: 'center', fontSize: 24 }}>Resume</h2>
                        <p style={{ color: '#64748b', marginBottom: 32, fontSize: 15 }}>Tan Kai Jun Keith — Accountancy & Data Analytics</p>
                        <button
                            onClick={() => resumeUrl ? window.open(resumeUrl, "_blank", "noopener,noreferrer") : alert('No resume URL set yet — log in as admin to add one.')}
                            style={{ ...s.btn, fontSize: 15, padding: '12px 36px', background: '#1e40af', color: '#fff', fontWeight: 600 }}>
                            Download / View PDF
                        </button>
                        {isAdmin && (
                            <div style={{ marginTop: 24 }}>
                                <EditBtn onClick={() => setModal({ type: 'resume', title: 'Edit Resume URL', data: { url: resumeUrl } })} label="resume URL" />
                                <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>Current URL: {resumeUrl || 'not set'}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* LEASE CALCULATOR */}
            {tab === "leaseCalc" && (
                <div>
                    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 24px 0' }}>
                        <button onClick={() => setTab('projects')} style={{ background: 'none', border: 'none', padding: 0, color: '#1e40af', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>← Back to Projects</button>
                    </div>
                    <LeaseCalculator />
                </div>
            )}

            <footer style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13, borderTop: '1px solid #e2e8f0' }}>
                © {new Date().getFullYear()} Tan Kai Jun Keith · Singapore
            </footer>
        </div>
    )
}

const s = {
    page: { minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative' },
    nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: 56, borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', zIndex: 100 },
    navBtn: { background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontSize: 14, padding: '18px 10px 16px', transition: 'color 0.15s' },
    hero: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', padding: '60px 24px', position: 'relative', background: 'linear-gradient(160deg, #eff6ff 0%, #f8fafc 60%)' },
    card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 16 },
    btn: { background: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
    badge: { background: '#f1f5f9', color: '#64748b', borderRadius: 6, padding: '4px 10px', fontSize: 12, whiteSpace: 'nowrap', border: '1px solid #e2e8f0' },
    tag: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 10px', fontSize: 13 },
    h2: { marginTop: 0, marginBottom: 20, fontSize: 20, fontWeight: 600, color: '#0f172a' },
    contactLink: { color: '#1e40af', textDecoration: 'none', fontSize: 15 },
    editBtn: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14, color: '#1e40af' },
    addBtn: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14, color: '#1e40af', fontWeight: 500 },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modal: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
    input: { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', color: '#0f172a', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
}
