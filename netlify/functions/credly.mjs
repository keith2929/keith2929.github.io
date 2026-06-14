export const handler = async (event) => {
    const username = event.queryStringParameters?.username
    if (!username) return { statusCode: 400, body: JSON.stringify({ error: 'username required' }) }

    try {
        const response = await fetch(`https://www.credly.com/users/${username}/badges.json`)
        const data = await response.json()
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
    }
}
