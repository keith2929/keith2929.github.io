import express from 'express'
import cors from 'cors'
import { google } from 'googleapis'
import 'dotenv/config'

const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

const SPREADSHEET_ID = process.env.SPREADSHEET_ID
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS)

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