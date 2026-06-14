import { useState, useEffect } from 'react'

// ── CONFIG ───────────────────────────────────────────────────
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || "keith"
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD
const GITHUB_USERNAME = "keith2929"
const CREDLY_USERNAME = "keith-tan.d370937e"
const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/sheet"

const HEADERS = {
    about: ['bio', 'email', 'phone', 'linkedin', 'github'],
    experience: ['company', 'role', 'period', 'points', 'color'],
    skills: ['category', 'skills'],
    certifications: ['name', 'url'],
    projects: ['title', 'period', 'description', 'tags'],
    home: ['available_text', 'name', 'subtitle', 'description', 'badge1', 'badge2', 'badge3'],
    education: ['school', 'degree', 'major', 'relevant', 'period'],
    resume: ['url'],
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
function EditBtn({ onClick }) {
    return <button onClick={onClick} style={s.editBtn} title="Edit">✏️</button>
}
function DeleteBtn({ onClick }) {
    return <button onClick={onClick} style={{ ...s.editBtn, background: '#fef2f2', color: '#ef4444', borderColor: '#fecaca' }} title="Delete">🗑</button>
}
function AddBtn({ onClick, label = "Add" }) {
    return <button onClick={onClick} style={s.addBtn}>+ {label}</button>
}

function Modal({ title, onClose, onSave, saving, children }) {
    return (
        <div style={s.overlay}>
            <div style={s.modal}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: 18 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer' }}>×</button>
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
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
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

// ── MAIN APP ─────────────────────────────────────────────────
export default function Portfolio() {
    const [tab, setTab] = useState("home")
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [showLogin, setShowLogin] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState('')
    const [modal, setModal] = useState(null)
    const [repos, setRepos] = useState([])
    const [reposLoading, setReposLoading] = useState(false)
    const [credlyBadges, setCredlyBadges] = useState([])
    const [credlyLoading, setCredlyLoading] = useState(false)
    const [activeFilter, setActiveFilter] = useState('All')
    const [selectedProject, setSelectedProject] = useState(null)

    const [about, setAbout] = useState({})
    const [experience, setExperience] = useState([])
    const [skills, setSkills] = useState([])
    const [certifications, setCertifications] = useState([])
    const [projects, setProjects] = useState([])
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
        ]).then(([a, exp, sk, cert, proj, hm, edu, res]) => {
            if (a[0]) setAbout(a[0])
            if (exp.length) setExperience(exp)
            if (sk.length) setSkills(sk)
            if (cert.length) setCertifications(cert)
            if (proj.length) setProjects(proj)
            if (hm[0]) setHomeData(hm[0])
            if (edu[0]) setEducation(edu[0])
            if (res[0]?.url) setResumeUrl(res[0].url)
            setLoading(false)
        }).catch(() => setLoading(false))

        setReposLoading(true)
        fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`)
            .then(r => r.json()).then(d => { setRepos(d.slice(0, 6)); setReposLoading(false) })
            .catch(() => setReposLoading(false))

        setCredlyLoading(true)
        fetch(`https://www.credly.com/users/${CREDLY_USERNAME}/badges.json`)
            .then(r => r.json()).then(d => { setCredlyBadges(d.data || []); setCredlyLoading(false) })
            .catch(() => setCredlyLoading(false))
    }, [])

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
        if (type === 'resume') { setResumeUrl(data.url); ok = await writeSheet('resume', [{ url: data.url }]) }

        setSaving(false)
        setModal(null)
        showToast(ok)
    }

    const deleteItem = async (type, index) => {
        if (!confirm('Delete this item?')) return
        const map = { experience: [experience, setExperience], skill: [skills, setSkills], certification: [certifications, setCertifications], project: [projects, setProjects] }
        const sheetMap = { experience: 'experience', skill: 'skills', certification: 'certifications', project: 'projects' }
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

    const navItems = ["home", "about", "experience", "skills", "projects", "resume"]

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
            <nav style={s.nav}>
                <span style={{ fontWeight: 700, fontSize: 18, color: '#1e40af', letterSpacing: '-0.5px' }}>KT</span>
                <div style={{ display: 'flex', gap: 4 }}>
                    {navItems.map(item => (
                        <button key={item} onClick={() => setTab(item)} style={{
                            ...s.navBtn,
                            color: tab === item ? '#1e40af' : '#64748b',
                            borderBottom: tab === item ? '2px solid #1e40af' : '2px solid transparent',
                            fontWeight: tab === item ? 600 : 400,
                        }}>
                            {item.charAt(0).toUpperCase() + item.slice(1)}
                        </button>
                    ))}
                </div>
                <div>
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
                        <EditBtn onClick={() => setModal({ type: 'homeData', title: 'Edit Home Page', data: { ...homeData } })} />
                    </div>}
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '6px 16px', marginBottom: 24 }}>
                        <span style={{ color: '#1d4ed8', fontSize: 13, fontWeight: 500 }}>🟢 {homeData.available_text}</span>
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
                                {isAdmin && <EditBtn onClick={() => setModal({ type: 'about', title: 'Edit About', data: { ...about } })} />}
                            </div>
                            <p style={{ color: '#475569', lineHeight: 1.8, margin: 0 }}>{about.bio}</p>
                        </div>
                        <div style={s.card}>
                            <div style={s.cardHeader}>
                                <h2 style={s.h2}>Education</h2>
                                {isAdmin && <EditBtn onClick={() => setModal({ type: 'education', title: 'Edit Education', data: { ...education } })} />}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                <div>
                                    <p style={{ color: '#0f172a', fontWeight: 600, fontSize: 17, margin: 0 }}>{education.school}</p>
                                    <p style={{ color: '#1e40af', marginTop: 4, marginBottom: 0, fontWeight: 500 }}>{education.degree}</p>
                                    <p style={{ color: '#64748b', fontSize: 13, marginTop: 2, marginBottom: 0 }}>{education.major}</p>
                                    <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 8, marginBottom: 0 }}>Relevant: {education.relevant}</p>
                                </div>
                                <span style={s.badge}>{education.period}</span>
                            </div>
                        </div>
                        <div style={s.card}>
                            <div style={s.cardHeader}>
                                <h2 style={s.h2}>Contact</h2>
                                {isAdmin && <EditBtn onClick={() => setModal({ type: 'about', title: 'Edit Contact', data: { ...about } })} />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {about.email && <a href={`mailto:${about.email}`} style={s.contactLink}>✉  {about.email}</a>}
                                {about.phone && <a href={`tel:${about.phone}`} style={s.contactLink}>📱  {about.phone}</a>}
                                {about.linkedin && <a href={`https://${about.linkedin}`} target="_blank" rel="noopener noreferrer" style={s.contactLink}>💼  {about.linkedin}</a>}
                                {about.github && <a href={`https://github.com/${about.github}`} target="_blank" rel="noopener noreferrer" style={s.contactLink}>🐙  github.com/{about.github}</a>}
                            </div>
                        </div>
                    </div>
                )}

                {/* EXPERIENCE */}
                {tab === "experience" && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 32 }}>
                            <h2 style={{ ...s.h2, margin: 0 }}>Work Experience</h2>
                            {isAdmin && <AddBtn onClick={() => setModal({ type: 'experience', title: 'Add Experience', data: { company: '', role: '', period: '', points: '', color: '#1e40af' }, index: -1 })} label="Add Job" />}
                        </div>
                        {(() => {
                            const getYear = (period) => {
                                const match = period?.match(/\d{4}/)
                                return match ? parseInt(match[0]) : 2024
                            }
                            const sorted = [...experience].sort((a, b) => getYear(b.period) - getYear(a.period))
                            const maxYear = Math.max(...sorted.map(j => getYear(j.period))) + 1
                            const minYear = Math.min(...sorted.map(j => getYear(j.period))) - 1
                            const years = []
                            for (let y = maxYear; y >= minYear; y--) years.push(y)
                            const PX_PER_YEAR = 120
                            const totalHeight = years.length * PX_PER_YEAR

                            return (
                                <div style={{ position: 'relative', minHeight: totalHeight + 60 }}>
                                    <div style={{ position: 'absolute', left: '50%', top: 0, height: totalHeight + 40, width: 2, background: '#e2e8f0', transform: 'translateX(-50%)', zIndex: 0 }} />
                                    {years.map((year, i) => (
                                        <div key={year} style={{ position: 'absolute', left: '50%', top: i * PX_PER_YEAR, transform: 'translateX(-50%)', background: '#f8fafc', padding: '2px 10px', borderRadius: 4, zIndex: 2, border: '1px solid #e2e8f0' }}>
                                            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>{year}</span>
                                        </div>
                                    ))}
                                    {sorted.map((job, idx) => {
                                        const year = getYear(job.period)
                                        const yearIndex = years.indexOf(year)
                                        const topPos = yearIndex * PX_PER_YEAR + 30
                                        const isLeft = idx % 2 === 0
                                        const jobColor = job.color || '#1e40af'

                                        return (
                                            <div key={idx} style={{ position: 'absolute', top: topPos, left: isLeft ? 0 : '50%', width: 'calc(50% - 24px)', marginLeft: isLeft ? 0 : 24, marginRight: isLeft ? 24 : 0, zIndex: 1 }}>
                                                <div style={{ background: '#fff', border: `1px solid ${jobColor}30`, borderLeft: `3px solid ${jobColor}`, borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ color: jobColor, fontWeight: 700, fontSize: 14, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.company}</p>
                                                            <p style={{ color: '#0f172a', fontSize: 13, margin: '2px 0 6px', fontWeight: 500 }}>{job.role}</p>
                                                            <span style={s.badge}>{job.period}</span>
                                                        </div>
                                                        {isAdmin && <div style={{ display: 'flex', gap: 4, marginLeft: 6, flexShrink: 0 }}>
                                                            <EditBtn onClick={() => setModal({ type: 'experience', title: 'Edit Experience', data: { ...job }, index: experience.indexOf(job) })} />
                                                            <DeleteBtn onClick={() => deleteItem('experience', experience.indexOf(job))} />
                                                        </div>}
                                                    </div>
                                                    <ul style={{ margin: '8px 0 0', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        {(job.points || '').split(';').map((p, i) => p.trim() && (
                                                            <li key={i} style={{ color: '#475569', lineHeight: 1.6, fontSize: 12 }}>{p.trim()}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div style={{
                                                    position: 'absolute', top: 20,
                                                    [isLeft ? 'right' : 'left']: -30,
                                                    width: 12, height: 12, borderRadius: '50%',
                                                    background: jobColor, border: '2px solid #f8fafc', zIndex: 3,
                                                }} />
                                            </div>
                                        )
                                    })}
                                    <div style={{ height: totalHeight + 60 }} />
                                </div>
                            )
                        })()}
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
                                                <EditBtn onClick={() => setModal({ type: 'skill', title: 'Edit Skills', data: { ...skills[idx] }, index: idx })} />
                                                <DeleteBtn onClick={() => deleteItem('skill', idx)} />
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
                                            <EditBtn onClick={() => setModal({ type: 'certification', title: 'Edit Certification', data: { ...cert }, index: idx })} />
                                            <DeleteBtn onClick={() => deleteItem('certification', idx)} />
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
                                                {getProjectIcon(p.tags)}
                                                {isAdmin && (
                                                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                                                        <EditBtn onClick={() => setModal({ type: 'project', title: 'Edit Project', data: { ...p }, index: projects.indexOf(p) })} />
                                                        <DeleteBtn onClick={() => deleteItem('project', projects.indexOf(p))} />
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
                                                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', fontSize: 13, fontWeight: 500 }}>View Code →</a>
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
                                            {getProjectIcon(selectedProject.tags)}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                                            <h3 style={{ margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 700 }}>{selectedProject.title}</h3>
                                            <button onClick={() => setSelectedProject(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer', flexShrink: 0 }}>×</button>
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

                {/* RESUME */}
                {tab === "resume" && (
                    <div style={{ ...s.card, marginTop: 24, textAlign: 'center', padding: 56 }}>
                        <div style={{ width: 64, height: 64, background: '#eff6ff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>📄</div>
                        <h2 style={{ ...s.h2, textAlign: 'center', fontSize: 24 }}>Resume</h2>
                        <p style={{ color: '#64748b', marginBottom: 32, fontSize: 15 }}>Tan Kai Jun Keith — Accountancy & Data Analytics</p>
                        <button
                            onClick={() => resumeUrl ? window.open(resumeUrl, "_blank", "noopener,noreferrer") : alert('No resume URL set yet — log in as admin to add one.')}
                            style={{ ...s.btn, fontSize: 15, padding: '12px 36px', background: '#1e40af', color: '#fff', fontWeight: 600 }}>
                            Download / View PDF
                        </button>
                        {isAdmin && (
                            <div style={{ marginTop: 24 }}>
                                <EditBtn onClick={() => setModal({ type: 'resume', title: 'Edit Resume URL', data: { url: resumeUrl } })} />
                                <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>Current URL: {resumeUrl || 'not set'}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

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
