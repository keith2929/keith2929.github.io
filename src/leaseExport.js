// Client-side Excel export — no backend involved. exceljs is loaded on demand
// (dynamic import) so it doesn't bloat the main bundle for visitors who never
// click "Export to Excel".

const NAVY = 'FF1F3864'
const TEAL = 'FF17375E'
const TEAL_LT = 'FF2E74B5'
const INPUT_BG = 'FFFFF2CC'
const CALC_BG = 'FFDEEAF1'
const WHITE = 'FFFFFFFF'
const LIGHT_ROW = 'FFEBF3FB'
const BORDER = 'FFB8CCE4'

const TYPE_LABELS = {
    amortization: 'Finance / Amortization',
    salesType: 'Sales-Type',
    bpo: 'Bargain Purchase Option',
}

function col(offset) {
    return String.fromCharCode('B'.charCodeAt(0) + offset)
}

function parseDateInput(str) {
    const [y, m, d] = str.split('-').map(Number)
    return new Date(y, m - 1, d)
}

export async function exportLeaseWorkbook({ leaseType, inputs, result }) {
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Lease Calculator')
    ws.views = [{ showGridLines: false }]
    ws.columns = [{ width: 4 }, { width: 22 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }]

    const thin = { style: 'thin', color: { argb: BORDER } }
    const border = { top: thin, left: thin, bottom: thin, right: thin }

    function styleCell(cell, { bg, color = 'FF000000', bold = false, size = 10, align = 'left', numFmt } = {}) {
        cell.font = { name: 'Calibri', size, bold, color: { argb: color } }
        cell.alignment = { horizontal: align, vertical: 'middle', wrapText: true }
        cell.border = border
        if (bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
        if (numFmt) cell.numFmt = numFmt
    }

    function sectionHeader(row, text, span = 'B:G') {
        const [from, to] = span.split(':')
        ws.mergeCells(`${from}${row}:${to}${row}`)
        ws.getCell(`${from}${row}`).value = text
        styleCell(ws.getCell(`${from}${row}`), { bg: NAVY, color: WHITE, bold: true, size: 11, align: 'center' })
    }

    let row = 2
    ws.mergeCells(`B${row}:G${row}`)
    ws.getCell(`B${row}`).value = '📊 Lease Amortization Calculator'
    styleCell(ws.getCell(`B${row}`), { bg: NAVY, color: WHITE, bold: true, size: 15, align: 'center' })
    ws.getRow(row).height = 28
    row++

    ws.mergeCells(`B${row}:G${row}`)
    ws.getCell(`B${row}`).value = `Lease Type: ${TYPE_LABELS[leaseType]}`
    styleCell(ws.getCell(`B${row}`), { bg: TEAL_LT, color: WHITE, bold: true, align: 'center' })
    row += 2

    sectionHeader(row, 'INPUT PARAMETERS')
    row++

    const inputRows = [
        ['Number of Years', Number(inputs.years), '0'],
        ['Periods per Year', Number(inputs.periodsPerYear), '0'],
        ['Lease Payment ($)', Number(inputs.payment), '#,##0.00'],
        ['Residual Value ($)', Number(inputs.residual), '#,##0.00'],
        ['Discount Rate (annual %)', Number(inputs.discountRate), '0.000'],
        ['Payment Timing', inputs.timing, null],
        ['Lease Start Date', parseDateInput(inputs.startDate), 'dd/mm/yyyy'],
    ]
    if (leaseType === 'salesType') inputRows.push(['Fair Value ($)', Number(inputs.fairValue), '#,##0.00'])
    if (leaseType === 'bpo') {
        inputRows.push(['BPO Exercised', inputs.bpoExercised, null])
        inputRows.push(['BPO Cost ($)', Number(inputs.bpoCost), '#,##0.00'])
    }

    inputRows.forEach(([label, value, numFmt]) => {
        ws.getCell(`B${row}`).value = label
        styleCell(ws.getCell(`B${row}`), { bg: NAVY, color: WHITE, bold: true })
        ws.getCell(`C${row}`).value = value
        styleCell(ws.getCell(`C${row}`), { bg: INPUT_BG, color: 'FF7B3F00', bold: true, align: 'center', numFmt })
        row++
    })
    row++

    sectionHeader(row, 'CALCULATED VALUES')
    row++
    const calcHeaders = ['Rate / Period', 'No. of Periods', 'Lease Liability (PV)']
    const calcValues = [[result.ratePerPeriod, '0.0000%'], [result.n, '0'], [result.liabilityPV, '#,##0.00']]
    if (leaseType === 'bpo') { calcHeaders.push('BPO-Adjusted PV'); calcValues.push([result.bpoAdjustedPV, '#,##0.00']) }
    if (leaseType === 'salesType') { calcHeaders.push('Fair Value − PV'); calcValues.push([result.fairValueVsPV, '#,##0.00']) }

    calcHeaders.forEach((h, i) => {
        ws.getCell(`${col(i)}${row}`).value = h
        styleCell(ws.getCell(`${col(i)}${row}`), { bg: TEAL_LT, color: WHITE, bold: true, align: 'center' })
    })
    row++
    calcValues.forEach(([v, numFmt], i) => {
        ws.getCell(`${col(i)}${row}`).value = v
        styleCell(ws.getCell(`${col(i)}${row}`), { bg: CALC_BG, bold: true, align: 'center', numFmt })
    })
    row += 2

    sectionHeader(row, 'AMORTIZATION SCHEDULE')
    row++
    const schedHeaders = ['Period', 'Date', 'Payment ($)', 'Interest ($)', 'Principal ($)', 'Balance ($)']
    schedHeaders.forEach((h, i) => {
        ws.getCell(`${col(i)}${row}`).value = h
        styleCell(ws.getCell(`${col(i)}${row}`), { bg: TEAL, color: WHITE, bold: true, align: 'center' })
    })
    row++
    result.schedule.forEach((r, idx) => {
        const bg = idx % 2 === 0 ? LIGHT_ROW : WHITE
        const vals = [
            [r.period, '0'], [r.date, 'dd/mm/yyyy'], [r.payment, '#,##0.00'],
            [r.interest, '#,##0.00'], [r.principal, '#,##0.00'], [r.balance, '#,##0.00'],
        ]
        vals.forEach(([v, numFmt], i) => {
            ws.getCell(`${col(i)}${row}`).value = v
            styleCell(ws.getCell(`${col(i)}${row}`), { bg, align: 'center', numFmt })
        })
        row++
    })
    row++

    sectionHeader(row, 'JOURNAL ENTRIES — AT INCEPTION')
    row++

    ws.mergeCells(`B${row}:D${row}`)
    ws.getCell(`B${row}`).value = 'Lessor'
    styleCell(ws.getCell(`B${row}`), { bg: TEAL, color: WHITE, bold: true, align: 'center' })
    ws.mergeCells(`E${row}:G${row}`)
    ws.getCell(`E${row}`).value = 'Lessee'
    styleCell(ws.getCell(`E${row}`), { bg: TEAL, color: WHITE, bold: true, align: 'center' })
    row++

    ;['Account', 'Debit ($)', 'Credit ($)'].forEach((h, i) => {
        ws.getCell(`${col(i)}${row}`).value = h
        styleCell(ws.getCell(`${col(i)}${row}`), { bg: TEAL_LT, color: WHITE, bold: true, align: 'center' })
        ws.getCell(`${col(i + 3)}${row}`).value = h
        styleCell(ws.getCell(`${col(i + 3)}${row}`), { bg: TEAL_LT, color: WHITE, bold: true, align: 'center' })
    })
    row++

    const maxRows = Math.max(result.inceptionJE.lessor.length, result.inceptionJE.lessee.length)
    for (let i = 0; i < maxRows; i++) {
        const l = result.inceptionJE.lessor[i]
        const r = result.inceptionJE.lessee[i]
        const bg = i % 2 === 0 ? LIGHT_ROW : WHITE
        if (l) {
            ws.getCell(`B${row}`).value = l.account
            styleCell(ws.getCell(`B${row}`), { bg, align: 'left' })
            ws.getCell(`C${row}`).value = l.debit ?? ''
            styleCell(ws.getCell(`C${row}`), { bg, align: 'center', numFmt: l.debit != null ? '#,##0.00' : undefined })
            ws.getCell(`D${row}`).value = l.credit ?? ''
            styleCell(ws.getCell(`D${row}`), { bg, align: 'center', numFmt: l.credit != null ? '#,##0.00' : undefined })
        }
        if (r) {
            ws.getCell(`E${row}`).value = r.account
            styleCell(ws.getCell(`E${row}`), { bg, align: 'left' })
            ws.getCell(`F${row}`).value = r.debit ?? ''
            styleCell(ws.getCell(`F${row}`), { bg, align: 'center', numFmt: r.debit != null ? '#,##0.00' : undefined })
            ws.getCell(`G${row}`).value = r.credit ?? ''
            styleCell(ws.getCell(`G${row}`), { bg, align: 'center', numFmt: r.credit != null ? '#,##0.00' : undefined })
        }
        row++
    }

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lease-calculator-${leaseType}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
