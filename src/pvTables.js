// PV / FV interest factor tables — ported from the reference "PV tables.xlsx"
// (PVIF, FVIF, PVIFA, PVIFA (Due), FVIFA, FVIFA (Due) sheets). Each sheet is a
// rate x period grid built off a single factor formula; reproduced here as
// pure functions instead of Excel's TABLE() what-if grid.

export function pvif(rate, n) {
    return Math.pow(1 + rate, -n)
}

export function fvif(rate, n) {
    return Math.pow(1 + rate, n)
}

export function pvifa(rate, n, due = false) {
    const ordinary = rate === 0 ? n : (1 - Math.pow(1 + rate, -n)) / rate
    return due ? ordinary * (1 + rate) : ordinary
}

export function fvifa(rate, n, due = false) {
    const ordinary = rate === 0 ? n : (Math.pow(1 + rate, n) - 1) / rate
    return due ? ordinary * (1 + rate) : ordinary
}

export const TABLE_TYPES = {
    PVIF: { label: 'PVIF — Present Value of $1', fn: (r, n) => pvif(r, n), hasDue: false },
    FVIF: { label: 'FVIF — Future Value of $1', fn: (r, n) => fvif(r, n), hasDue: false },
    PVIFA: { label: 'PVIFA — Present Value of an Annuity of $1', fn: (r, n, due) => pvifa(r, n, due), hasDue: true },
    FVIFA: { label: 'FVIFA — Future Value of an Annuity of $1', fn: (r, n, due) => fvifa(r, n, due), hasDue: true },
}

export function buildTable(type, due, config) {
    const { startRate, stepRate, rateCount, startPeriod, stepPeriod, periodCount } = config
    const rates = Array.from({ length: rateCount }, (_, i) => startRate + i * stepRate)
    const periods = Array.from({ length: periodCount }, (_, i) => startPeriod + i * stepPeriod)
    const fn = TABLE_TYPES[type].fn
    const grid = periods.map(n => rates.map(r => fn(r, n, due)))
    return { rates, periods, grid }
}
