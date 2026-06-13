import { google } from 'googleapis'

const SPREADSHEET_ID = process.env.SPREADSHEET_ID
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS)

async function getSheets() {
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    return google.sheets({ version: 'v4', auth })
}

export const handler = async (event) => {
    const name = event.path.split('/').pop()

    try {
        if (event.httpMethod === 'GET') {
            const sheets = await getSheets()
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: name,
            })
            const [headers, ...rows] = response.data.values || [[]]
            const data = rows.map(row => {
                const obj = {}
                headers.forEach((h, i) => { obj[h.trim()] = row[i] || '' })
                return obj
            })
            return { statusCode: 200, body: JSON.stringify(data) }
        }

        if (event.httpMethod === 'PUT') {
            const { headers, rows } = JSON.parse(event.body)
            const values = [
                headers,
                ...rows.map(row => headers.map(h => row[h] || ''))
            ]
            const sheets = await getSheets()
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: name,
                valueInputOption: 'RAW',
                requestBody: { range: name, majorDimension: 'ROWS', values },
            })
            return { statusCode: 200, body: JSON.stringify({ ok: true }) }
        }

        return { statusCode: 405, body: 'Method Not Allowed' }
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
    }
}
