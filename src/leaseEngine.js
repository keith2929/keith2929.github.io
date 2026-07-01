// Lease amortization calculation engine.
// Ported from the verified reference workbook (Amortization / sales type / BPO
// sheets): PV of the payment stream via Excel's PV() semantics, then a
// period-by-period effective-interest schedule. Discount rate is entered as a
// percentage (e.g. 6.025 for 6.025%) and converted to decimal internally.

export function excelPV(rate, nper, pmt, fv = 0, type = 0) {
    if (rate === 0) return -(pmt * nper + fv)
    const pow = Math.pow(1 + rate, nper)
    return -((pmt * (1 + rate * type) * (pow - 1)) / rate + fv) / pow
}

export function addMonths(date, months) {
    const d = new Date(date.getTime())
    const targetMonth = d.getMonth() + months
    const result = new Date(d.getFullYear(), targetMonth, 1)
    const daysInTargetMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
    result.setDate(Math.min(d.getDate(), daysInTargetMonth))
    return result
}

export function computeLease(inputs) {
    const {
        leaseType,           // 'amortization' | 'salesType' | 'bpo'
        years,
        periodsPerYear,
        payment,
        residual,
        discountRatePercent, // e.g. 6.025 => 6.025%
        timing,              // 'Beginning' | 'End'
        startDate,           // Date
        fairValue = 0,       // salesType only
        bpoExercised = 'No', // bpo only
        bpoCost = 0,         // bpo only
    } = inputs

    const n = Math.round(years * periodsPerYear)
    const annualRate = discountRatePercent / 100
    const ratePerPeriod = annualRate / periodsPerYear
    const type = timing === 'Beginning' ? 1 : 0

    const basePV = excelPV(ratePerPeriod, n, -payment, residual, type)
    const bpoAdjustedPV = leaseType === 'bpo'
        ? basePV + bpoCost / Math.pow(1 + annualRate, n)
        : null
    const liabilityPV = leaseType === 'bpo' && bpoExercised === 'Yes' ? bpoAdjustedPV : basePV
    const fairValueVsPV = leaseType === 'salesType' ? fairValue - basePV : null

    const schedule = []
    let balance = liabilityPV
    for (let i = 0; i < n; i++) {
        const date = i === 0 ? startDate : addMonths(schedule[i - 1].date, 12 / periodsPerYear)
        const paymentAmt = i === 0 ? (timing === 'Beginning' ? payment : 0) : payment
        let interest, principal, newBalance
        if (i === 0) {
            interest = 0
            principal = paymentAmt
            newBalance = balance - principal
        } else {
            interest = balance * ratePerPeriod
            principal = paymentAmt - interest
            newBalance = balance - principal
        }
        schedule.push({ period: i + 1, date, payment: paymentAmt, interest, principal, balance: newBalance })
        balance = newBalance
    }

    const inceptionJE = {
        lessor: [
            { account: 'Dr Lease Receivable', debit: liabilityPV, credit: null },
            { account: 'Cr Equipment', debit: null, credit: liabilityPV },
            { account: 'Cr Cash', debit: null, credit: 0 },
        ],
        lessee: [
            { account: 'Dr ROU Asset', debit: liabilityPV, credit: null },
            { account: 'Cr Lease Liability', debit: null, credit: liabilityPV },
        ],
    }
    if (leaseType === 'salesType') {
        inceptionJE.lessor.push(
            { account: 'Dr COGS', debit: liabilityPV, credit: null },
            { account: 'Cr Revenue', debit: null, credit: liabilityPV },
        )
    }

    return { n, ratePerPeriod, annualRate, liabilityPV, bpoAdjustedPV, fairValueVsPV, schedule, inceptionJE }
}

export function lookupPeriodJE(schedule, lookupDate) {
    const row = schedule.find(r => r.date.toDateString() === lookupDate.toDateString())
    if (!row) return null
    return {
        lessor: [
            { account: 'Dr Cash', debit: row.payment, credit: null },
            { account: 'Cr Interest Revenue', debit: null, credit: row.interest },
            { account: 'Cr Lease Receivable', debit: null, credit: row.principal },
        ],
        lessee: [
            { account: 'Dr Interest Expense', debit: row.interest, credit: null },
            { account: 'Dr Lease Liability', debit: row.principal, credit: null },
            { account: 'Cr Cash', debit: null, credit: row.payment },
        ],
    }
}
