import express from 'express'
import cors from 'cors'
import { google } from 'googleapis'
import { readFileSync } from 'fs'

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

const SPREADSHEET_ID = '1A7T-oP0EM9yd1HoJcYFCUslcc4S9PeAdnTFPh-x5AOk'
const credentials = JSON.parse(readFileSync('./credentials.json', 'utf8'))

async function getSheets() {
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    return google.sheets({ version: 'v4', auth })
}

// READ a sheet tab
app.get('/api/sheet/:name', async (req, res) => {
    try {
        const sheets = await getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: req.params.name,
        })
        const [headers, ...rows] = response.data.values || [[]]
        const data = rows.map(row => {
            const obj = {}
            headers.forEach((h, i) => { obj[h.trim()] = row[i] || '' })
            return obj
        })
        res.json(data)
    } catch (err) {
        console.error('Read error:', err.message)
        res.status(500).json({ error: err.message })
    }
})

// WRITE a sheet tab (replaces all data)
app.put('/api/sheet/:name', async (req, res) => {
    try {
        const { headers, rows } = req.body
        const values = [
            headers,
            ...rows.map(row => headers.map(h => row[h] || ''))
        ]
        const sheets = await getSheets()
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: req.params.name,
            valueInputOption: 'RAW',
            requestBody: { range: req.params.name, majorDimension: 'ROWS', values },
        })
        res.json({ ok: true })
    } catch (err) {
        console.error('Write error:', err.message)
        res.status(500).json({ error: err.message })
    }
})

app.listen(3001, () => console.log('✅ API server running on http://localhost:3001'))