import { useMemo, useState } from 'react'
import { computeLease, lookupPeriodJE } from './leaseEngine'
import { exportLeaseWorkbook } from './leaseExport'
import { TABLE_TYPES, buildTable, pvif } from './pvTables'

const LEASE_TYPES = [
    { value: 'amortization', label: 'Finance / Amortization' },
    { value: 'salesType', label: 'Sales-Type' },
    { value: 'bpo', label: 'Bargain Purchase Option (BPO)' },
]

function fmtMoney(v) {
    if (v == null || Number.isNaN(v)) return '—'
    return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFactor(v) {
    if (v == null || Number.isNaN(v)) return '—'
    return v.toFixed(6)
}

function fmtDate(d) {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${dd}/${mm}/${d.getFullYear()}`
}

function parseDateInput(str) {
    const [y, m, d] = str.split('-').map(Number)
    return new Date(y, m - 1, d)
}

function toDateInputValue(d) {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}

function Field({ label, hint, children }) {
    return (
        <div>
            <label style={st.label}>{label}</label>
            {children}
            {hint && <p style={st.hint}>{hint}</p>}
        </div>
    )
}

function FactorTables({ leaseRatePercent, leaseN }) {
    const [open, setOpen] = useState(false)
    const [tableType, setTableType] = useState('PVIF')
    const [due, setDue] = useState('Regular')
    const [startRate, setStartRate] = useState(1)
    const [stepRate, setStepRate] = useState(1)
    const [rateCount, setRateCount] = useState(30)
    const [startPeriod, setStartPeriod] = useState(1)
    const [stepPeriod, setStepPeriod] = useState(1)
    const [periodCount, setPeriodCount] = useState(60)

    const typeInfo = TABLE_TYPES[tableType]

    const table = useMemo(() => {
        if (!open) return null
        return buildTable(tableType, due === 'Due', {
            startRate: Number(startRate) / 100,
            stepRate: Number(stepRate) / 100,
            rateCount: Math.min(Math.max(Number(rateCount) || 1, 1), 50),
            startPeriod: Number(startPeriod),
            stepPeriod: Number(stepPeriod),
            periodCount: Math.min(Math.max(Number(periodCount) || 1, 1), 100),
        })
    }, [open, tableType, due, startRate, stepRate, rateCount, startPeriod, stepPeriod, periodCount])

    const highlightCol = useMemo(() => {
        if (!table || leaseRatePercent == null) return -1
        let best = 0, bestDiff = Infinity
        table.rates.forEach((r, i) => {
            const diff = Math.abs(r * 100 - leaseRatePercent)
            if (diff < bestDiff) { bestDiff = diff; best = i }
        })
        return best
    }, [table, leaseRatePercent])

    const highlightRow = useMemo(() => {
        if (!table || leaseN == null) return -1
        return table.periods.findIndex(p => p === leaseN)
    }, [table, leaseN])

    return (
        <div style={st.card}>
            <button onClick={() => setOpen(o => !o)} style={st.factorToggle}>
                {open ? '▾' : '▸'} PV / FV Factor Tables
            </button>
            {open && (
                <div style={{ marginTop: 18 }}>
                    <div style={st.grid}>
                        <Field label="Table">
                            <select value={tableType} onChange={e => setTableType(e.target.value)} style={st.input}>
                                {Object.entries(TABLE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </Field>
                        {typeInfo.hasDue && (
                            <Field label="Annuity Timing">
                                <select value={due} onChange={e => setDue(e.target.value)} style={st.input}>
                                    <option>Regular</option>
                                    <option>Due</option>
                                </select>
                            </Field>
                        )}
                        <Field label="Start Rate (%)">
                            <input type="number" step="0.01" value={startRate} onChange={e => setStartRate(e.target.value)} style={st.input} />
                        </Field>
                        <Field label="Step Rate (%)">
                            <input type="number" step="0.01" value={stepRate} onChange={e => setStepRate(e.target.value)} style={st.input} />
                        </Field>
                        <Field label="Columns (rates)">
                            <input type="number" min="1" max="50" value={rateCount} onChange={e => setRateCount(e.target.value)} style={st.input} />
                        </Field>
                        <Field label="Start Period">
                            <input type="number" value={startPeriod} onChange={e => setStartPeriod(e.target.value)} style={st.input} />
                        </Field>
                        <Field label="Step Period">
                            <input type="number" value={stepPeriod} onChange={e => setStepPeriod(e.target.value)} style={st.input} />
                        </Field>
                        <Field label="Rows (periods)">
                            <input type="number" min="1" max="100" value={periodCount} onChange={e => setPeriodCount(e.target.value)} style={st.input} />
                        </Field>
                    </div>

                    {leaseRatePercent != null && (
                        <p style={st.hint}>Highlighted cell = closest match to this lease's rate/period ({leaseRatePercent.toFixed(4)}% · n={leaseN}).</p>
                    )}

                    {table && (
                        <div style={{ ...st.scheduleScroll, maxHeight: 480, overflowX: 'auto', marginTop: 12 }}>
                            <table style={st.factorTable}>
                                <thead>
                                    <tr>
                                        <th style={st.factorCorner}>n \ r</th>
                                        {table.rates.map((r, i) => (
                                            <th key={i} style={{ ...st.factorTh, ...(i === highlightCol ? st.factorHighlightHeader : null) }}>
                                                {(r * 100).toFixed(2)}%
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {table.periods.map((p, ri) => (
                                        <tr key={ri}>
                                            <td style={{ ...st.factorRowHead, ...(ri === highlightRow ? st.factorHighlightHeader : null) }}>{p}</td>
                                            {table.grid[ri].map((v, ci) => (
                                                <td key={ci} style={{ ...st.factorTd, ...(ri === highlightRow && ci === highlightCol ? st.factorHighlightCell : null) }}>
                                                    {v.toFixed(4)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function JETable({ title, rows }) {
    return (
        <div>
            <p style={st.jeTitle}>{title}</p>
            <table style={st.jeTable}>
                <thead>
                    <tr>
                        <th style={st.jeTh}>Account</th>
                        <th style={{ ...st.jeTh, textAlign: 'right' }}>Debit</th>
                        <th style={{ ...st.jeTh, textAlign: 'right' }}>Credit</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i}>
                            <td style={st.jeTd}>{r.account}</td>
                            <td style={{ ...st.jeTd, textAlign: 'right' }}>{r.debit != null ? fmtMoney(r.debit) : ''}</td>
                            <td style={{ ...st.jeTd, textAlign: 'right' }}>{r.credit != null ? fmtMoney(r.credit) : ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default function LeaseCalculator() {
    const [leaseType, setLeaseType] = useState('amortization')
    const [years, setYears] = useState(10)
    const [periodsPerYear, setPeriodsPerYear] = useState(1)
    const [payment, setPayment] = useState(101200)
    const [residual, setResidual] = useState(0)
    const [discountRate, setDiscountRate] = useState(6.025)
    const [timing, setTiming] = useState('Beginning')
    const [startDate, setStartDate] = useState('2024-01-01')
    const [fairValue, setFairValue] = useState(0)
    const [bpoExercised, setBpoExercised] = useState('No')
    const [bpoCost, setBpoCost] = useState(0)
    const [perspective, setPerspective] = useState('Both')
    const [jeDate, setJeDate] = useState('')

    const inputsValid = years > 0 && periodsPerYear > 0 && payment > 0 && discountRate > 0

    function runCalculation() {
        const inputs = {
            leaseType,
            years: Number(years),
            periodsPerYear: Number(periodsPerYear),
            payment: Number(payment),
            residual: Number(residual),
            discountRate: Number(discountRate),
            timing,
            startDate,
            fairValue: Number(fairValue),
            bpoExercised,
            bpoCost: Number(bpoCost),
        }
        const result = computeLease({
            leaseType,
            years: Number(years),
            periodsPerYear: Number(periodsPerYear),
            payment: Number(payment),
            residual: Number(residual),
            discountRatePercent: Number(discountRate),
            timing,
            startDate: parseDateInput(startDate),
            fairValue: Number(fairValue),
            bpoExercised,
            bpoCost: Number(bpoCost),
        })
        return { inputs, result }
    }

    // Results only update when "Calculate" is pressed, so the page doesn't
    // reflow on every keystroke. Seeded with the default inputs on mount.
    const [calculated, setCalculated] = useState(() => runCalculation())

    const handleCalculate = () => {
        if (!inputsValid) return
        setCalculated(runCalculation())
        setJeDate('')
    }

    const periodJE = useMemo(() => {
        if (!calculated || !jeDate) return null
        return lookupPeriodJE(calculated.result.schedule, parseDateInput(jeDate))
    }, [calculated, jeDate])

    const { inputs, result } = calculated

    const showLessor = perspective !== 'Lessee only'
    const showLessee = perspective !== 'Lessor only'

    return (
        <div style={st.wrap}>
            <div style={st.banner}>
                <h2 style={st.bannerTitle}>📊 Lease Amortization Calculator</h2>
                <p style={st.bannerSub}>IFRS 16 / ASC 842 — Finance, Sales-Type &amp; BPO lease accounting</p>
            </div>

            {/* INPUTS */}
            <div style={st.card}>
                <div style={st.cardHeaderRow}>
                    <h3 style={st.h3}>Inputs</h3>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <select value={leaseType} onChange={e => setLeaseType(e.target.value)} style={st.select}>
                            {LEASE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <select value={perspective} onChange={e => setPerspective(e.target.value)} style={st.select}>
                            <option>Both</option>
                            <option>Lessee only</option>
                            <option>Lessor only</option>
                        </select>
                    </div>
                </div>

                <div style={st.grid}>
                    <Field label="Number of Years">
                        <input type="number" min="1" value={years} onChange={e => setYears(e.target.value)} style={st.input} />
                    </Field>
                    <Field label="Periods per Year" hint="1 = annual · 12 = monthly · 4 = quarterly">
                        <input type="number" min="1" value={periodsPerYear} onChange={e => setPeriodsPerYear(e.target.value)} style={st.input} />
                    </Field>
                    <Field label="Lease Payment ($)">
                        <input type="number" step="0.01" value={payment} onChange={e => setPayment(e.target.value)} style={st.input} />
                    </Field>
                    <Field label="Residual Value ($)" hint="guaranteed residual at end">
                        <input type="number" step="0.01" value={residual} onChange={e => setResidual(e.target.value)} style={st.input} />
                    </Field>
                    <Field label="Discount Rate (annual %)" hint="e.g. 6.025 for 6.025%">
                        <input type="number" step="0.001" value={discountRate} onChange={e => setDiscountRate(e.target.value)} style={st.input} />
                    </Field>
                    <Field label="Payment Timing">
                        <select value={timing} onChange={e => setTiming(e.target.value)} style={st.input}>
                            <option>Beginning</option>
                            <option>End</option>
                        </select>
                    </Field>
                    <Field label="Lease Start Date">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={st.input} />
                    </Field>

                    {leaseType === 'salesType' && (
                        <Field label="Fair Value ($)" hint="fair value of underlying asset">
                            <input type="number" step="0.01" value={fairValue} onChange={e => setFairValue(e.target.value)} style={st.input} />
                        </Field>
                    )}
                    {leaseType === 'bpo' && (
                        <>
                            <Field label="Bargain Purchase Option">
                                <select value={bpoExercised} onChange={e => setBpoExercised(e.target.value)} style={st.input}>
                                    <option>No</option>
                                    <option>Yes</option>
                                </select>
                            </Field>
                            <Field label="BPO Cost ($)" hint="purchase cost if exercised">
                                <input type="number" step="0.01" value={bpoCost} onChange={e => setBpoCost(e.target.value)} style={st.input} />
                            </Field>
                        </>
                    )}
                </div>

                {!inputsValid && <p style={st.warning}>⚠ Check inputs — years, periods/year, payment and discount rate must all be greater than 0.</p>}

                <button onClick={handleCalculate} disabled={!inputsValid} style={{ ...st.calculateBtn, opacity: inputsValid ? 1 : 0.5, cursor: inputsValid ? 'pointer' : 'not-allowed' }}>
                    Calculate
                </button>
            </div>

            <>
                    {/* CALCULATED VALUES */}
                    <div style={st.card}>
                        <h3 style={st.h3}>Calculated Values</h3>
                        <div style={st.calcGrid}>
                            <div style={st.calcBox}>
                                <p style={st.calcLabel}>Rate / Period</p>
                                <p style={st.calcValue}>{(result.ratePerPeriod * 100).toFixed(4)}%</p>
                            </div>
                            <div style={st.calcBox}>
                                <p style={st.calcLabel}>Number of Periods</p>
                                <p style={st.calcValue}>{result.n}</p>
                            </div>
                            <div style={st.calcBox}>
                                <p style={st.calcLabel}>Lease Liability (PV)</p>
                                <p style={st.calcValue}>${fmtMoney(result.liabilityPV)}</p>
                            </div>
                            {inputs.leaseType === 'bpo' && (
                                <div style={st.calcBox}>
                                    <p style={st.calcLabel}>BPO-Adjusted PV</p>
                                    <p style={st.calcValue}>${fmtMoney(result.bpoAdjustedPV)}</p>
                                    <p style={st.calcCaption}>
                                        ${fmtMoney(inputs.bpoCost)} × {fmtFactor(pvif(result.annualRate, result.n))} (PVIF)
                                    </p>
                                </div>
                            )}
                            {inputs.leaseType === 'salesType' && (
                                <div style={st.calcBox}>
                                    <p style={st.calcLabel}>Fair Value − PV</p>
                                    <p style={st.calcValue}>${fmtMoney(result.fairValueVsPV)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SCHEDULE */}
                    <div style={st.card}>
                        <div style={st.cardHeaderRow}>
                            <h3 style={st.h3}>Amortization Schedule</h3>
                            <button
                                style={st.exportBtn}
                                onClick={() => exportLeaseWorkbook({ leaseType: inputs.leaseType, inputs, result })}
                            >
                                ⬇ Export to Excel
                            </button>
                        </div>
                        <div style={st.scheduleScroll}>
                            <table style={st.table}>
                                <thead>
                                    <tr>
                                        <th style={st.th}>Period</th>
                                        <th style={st.th}>Date</th>
                                        <th style={{ ...st.th, textAlign: 'right' }}>Payment ($)</th>
                                        <th style={{ ...st.th, textAlign: 'right' }}>Interest ($)</th>
                                        <th style={{ ...st.th, textAlign: 'right' }}>Principal ($)</th>
                                        <th style={{ ...st.th, textAlign: 'right' }}>Balance ($)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.schedule.map(r => (
                                        <tr key={r.period} style={r.period % 2 === 0 ? st.rowAlt : undefined}>
                                            <td style={st.td}>{r.period}</td>
                                            <td style={st.td}>{fmtDate(r.date)}</td>
                                            <td style={{ ...st.td, textAlign: 'right' }}>{fmtMoney(r.payment)}</td>
                                            <td style={{ ...st.td, textAlign: 'right' }}>{fmtMoney(r.interest)}</td>
                                            <td style={{ ...st.td, textAlign: 'right' }}>{fmtMoney(r.principal)}</td>
                                            <td style={{ ...st.td, textAlign: 'right' }}>{fmtMoney(r.balance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* JOURNAL ENTRIES */}
                    <div style={st.card}>
                        <h3 style={st.h3}>Journal Entries</h3>
                        <p style={st.jeSectionLabel}>At Inception</p>
                        <div style={st.jeCols}>
                            {showLessor && <JETable title="Lessor" rows={result.inceptionJE.lessor} />}
                            {showLessee && <JETable title="Lessee" rows={result.inceptionJE.lessee} />}
                        </div>

                        <p style={{ ...st.jeSectionLabel, marginTop: 24 }}>Period Entry Lookup</p>
                        <select value={jeDate} onChange={e => setJeDate(e.target.value)} style={{ ...st.input, maxWidth: 260, marginBottom: 16 }}>
                            <option value="">Select a period date…</option>
                            {result.schedule.map(r => (
                                <option key={r.period} value={toDateInputValue(r.date)}>
                                    Period {r.period} — {fmtDate(r.date)}
                                </option>
                            ))}
                        </select>
                        {periodJE && (
                            <div style={st.jeCols}>
                                {showLessor && <JETable title="Lessor" rows={periodJE.lessor} />}
                                {showLessee && <JETable title="Lessee" rows={periodJE.lessee} />}
                            </div>
                        )}
                    </div>

                    {/* PV / FV FACTOR TABLES */}
                    <FactorTables leaseRatePercent={result.ratePerPeriod * 100} leaseN={result.n} />
            </>
        </div>
    )
}

const st = {
    wrap: { maxWidth: 1080, margin: '0 auto', padding: '24px 24px 60px' },
    banner: { background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)', borderRadius: 12, padding: '28px 32px', marginBottom: 20, textAlign: 'center' },
    bannerTitle: { color: '#fff', fontSize: 24, margin: '0 0 6px', fontWeight: 700 },
    bannerSub: { color: '#bfdbfe', fontSize: 14, margin: 0 },
    card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    cardHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
    h3: { margin: 0, fontSize: 17, fontWeight: 600, color: '#0f172a' },
    select: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', color: '#0f172a', fontSize: 13, fontFamily: 'inherit' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
    label: { display: 'block', color: '#64748b', fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    hint: { color: '#94a3b8', fontSize: 11, margin: '4px 0 0' },
    input: { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', color: '#0f172a', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
    warning: { color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginTop: 16 },
    calcGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 },
    calcBox: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px' },
    calcLabel: { color: '#1d4ed8', fontSize: 12, margin: '0 0 6px', fontWeight: 500 },
    calcValue: { color: '#0f172a', fontSize: 18, margin: 0, fontWeight: 700 },
    calcCaption: { color: '#64748b', fontSize: 11, margin: '6px 0 0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
    calculateBtn: { background: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 600, marginTop: 18 },
    scheduleScroll: { maxHeight: 420, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: { position: 'sticky', top: 0, background: '#1e40af', color: '#fff', textAlign: 'left', padding: '10px 12px', fontWeight: 600, fontSize: 12 },
    td: { padding: '8px 12px', color: '#334155', borderBottom: '1px solid #f1f5f9' },
    rowAlt: { background: '#f8fafc' },
    exportBtn: { background: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
    jeSectionLabel: { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, margin: '0 0 12px' },
    jeCols: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 },
    jeTitle: { color: '#0f172a', fontWeight: 600, fontSize: 13, margin: '0 0 8px' },
    jeTable: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    jeTh: { textAlign: 'left', padding: '8px 10px', background: '#f1f5f9', color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
    jeTd: { padding: '8px 10px', borderBottom: '1px solid #f1f5f9', color: '#334155' },
    factorToggle: { background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 17, fontWeight: 600, color: '#0f172a' },
    factorTable: { borderCollapse: 'separate', borderSpacing: 0, fontSize: 12, whiteSpace: 'nowrap' },
    factorCorner: { position: 'sticky', top: 0, left: 0, zIndex: 3, background: '#1e40af', color: '#fff', padding: '8px 10px', fontWeight: 600, borderRight: '1px solid #2E74B5', borderBottom: '1px solid #2E74B5' },
    factorTh: { position: 'sticky', top: 0, zIndex: 1, background: '#1e40af', color: '#fff', padding: '8px 10px', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid #2E74B5' },
    factorRowHead: { position: 'sticky', left: 0, zIndex: 1, background: '#1e40af', color: '#fff', padding: '6px 10px', fontWeight: 600, textAlign: 'center', borderRight: '1px solid #2E74B5' },
    factorTd: { padding: '6px 10px', color: '#334155', textAlign: 'right', borderBottom: '1px solid #f1f5f9' },
    factorHighlightHeader: { background: '#b45309' },
    factorHighlightCell: { background: '#fef3c7', fontWeight: 700, color: '#7c2d12' },
}
