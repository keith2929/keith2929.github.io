function cleanLocation(raw) {
    if (!raw) return null
    const s = raw.trim()
    // Skip garbage OCR data
    if (!s || s.toLowerCase() === 'unknown') return null
    if (/receipt\s*no/i.test(s) || /order\s*no/i.test(s) || /invoice/i.test(s)) return null
    if (s.length < 4) return null

    // Remove unit numbers like #01-01, #B1-224, #05-K2
    let cleaned = s.replace(/#[\w]+-[\w]+/g, '').replace(/\s{2,}/g, ' ').trim()
    // Remove trailing commas
    cleaned = cleaned.replace(/,\s*$/, '').trim()
    // Strip postal code (6 digits)
    cleaned = cleaned.replace(/\bsingapore\s+\d{6}\b/i, 'Singapore').trim()
    cleaned = cleaned.replace(/\b\d{6}\b/, '').trim()
    // If it's a block address like "BLK 739A BEDOK RESERVOIR RD", simplify
    cleaned = cleaned.replace(/^BLK\s+\w+\s+/i, '').trim()

    if (!cleaned.toLowerCase().includes('singapore')) cleaned += ', Singapore'
    return cleaned
}

export async function handler(event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    let locations
    try { locations = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }
    if (!Array.isArray(locations)) return { statusCode: 400, body: 'Expected array' }

    const results = []

    for (const raw of locations) {
        const query = cleanLocation(raw)
        if (!query) { results.push({ loc: raw, lat: null, lng: null }); continue }

        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=sg`
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'keithktan.com/spending-dashboard',
                    'Accept-Language': 'en',
                },
            })
            const data = await res.json()
            if (data[0]) {
                results.push({ loc: raw, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name })
            } else {
                results.push({ loc: raw, lat: null, lng: null })
            }
        } catch {
            results.push({ loc: raw, lat: null, lng: null })
        }

        // Nominatim fair-use: 1 req/sec
        await new Promise(r => setTimeout(r, 1100))
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
    }
}
