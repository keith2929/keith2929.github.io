export async function handler(event) {
    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Supabase not configured' }) }
    }

    try {
        // Fetch receipts ordered by date desc, limit 500
        const url = `${SUPABASE_URL}/rest/v1/receipts?select=merchant,location,receipt_date,total_amount,payment_method,items&order=receipt_date.desc&limit=500`
        const res = await fetch(url, {
            headers: {
                apikey: SUPABASE_SERVICE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
            },
        })

        if (!res.ok) {
            const text = await res.text()
            return { statusCode: res.status, body: JSON.stringify({ error: text }) }
        }

        const data = await res.json()
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
    }
}
