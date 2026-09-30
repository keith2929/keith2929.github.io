// Proxies the GitHub repo list so the site isn't hitting the unauthenticated
// API (60 req/hr per IP) from every visitor's browser. Set GITHUB_TOKEN in the
// Netlify environment to raise that to 5,000/hr; without it the CDN cache below
// still collapses repeat traffic into one upstream call per hour.
export const handler = async (event) => {
    const username = event.queryStringParameters?.username
    if (!username) return { statusCode: 400, body: JSON.stringify({ error: 'username required' }) }

    const headers = {
        'User-Agent': 'keithktan.com',
        Accept: 'application/vnd.github+json',
    }
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

    try {
        const res = await fetch(
            `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`,
            { headers },
        )
        if (!res.ok) {
            return {
                statusCode: res.status,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: `GitHub API responded ${res.status}` }),
            }
        }

        const data = await res.json()
        if (!Array.isArray(data)) {
            return { statusCode: 502, body: JSON.stringify({ error: 'Unexpected GitHub response' }) }
        }

        // only what the Projects tab renders
        const repos = data.map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            language: r.language,
            html_url: r.html_url,
            stargazers_count: r.stargazers_count,
            fork: r.fork,
            updated_at: r.updated_at,
        }))

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=600',
                'Netlify-CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
            body: JSON.stringify(repos),
        }
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
    }
}
