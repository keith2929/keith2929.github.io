import { google } from 'googleapis'

// The site is client-rendered, so crawlers and link unfurlers only ever see the
// static index.html — sheet data arrives long after they have stopped reading.
// This bakes the public profile fields into that file at build time, so the
// sheet is the single source of truth for what Google and LinkedIn show too.
//
// It overwrites only the fields the sheet actually carries; anything hand-written
// in index.html that has no sheet equivalent (postal address, languages, the
// Credly profile link, the keyword tail on the title) is left alone. A sheet that
// cannot be reached leaves the file untouched rather than failing the deploy.

const TABS = ['about', 'home', 'education', 'skills']

const toRows = values => {
    const [headers, ...rows] = values || [[]]
    if (!headers?.length) return []
    return rows.map(row => Object.fromEntries(headers.map((h, i) => [h.trim(), row[i] || ''])))
}

async function readSheet(env) {
    const { SPREADSHEET_ID, GOOGLE_CREDENTIALS } = env
    if (!SPREADSHEET_ID || !GOOGLE_CREDENTIALS) return null

    const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(GOOGLE_CREDENTIALS),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })
    const sheets = google.sheets({ version: 'v4', auth })
    const { data } = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: SPREADSHEET_ID,
        ranges: TABS,
    })
    return Object.fromEntries(TABS.map((tab, i) => [tab, toRows(data.valueRanges[i].values)]))
}

const attr = v => String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// one sentence's worth — past ~160 chars search results truncate anyway
const clamp = (text, max = 155) => {
    const t = String(text || '').replace(/\s+/g, ' ').trim()
    if (t.length <= max) return t
    const cut = t.lastIndexOf(' ', max - 1)
    return t.slice(0, cut > 0 ? cut : max - 1).replace(/[,;:.\s]+$/, '') + '…'
}

const escapeRe = v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const setMeta = (html, key, name, value) => {
    if (!value) return html
    const re = new RegExp(`(<meta\\s+${key}="${escapeRe(name)}"\\s+content=")[^"]*(")`, 'i')
    return html.replace(re, `$1${attr(value)}$2`)
}

export default function sheetSeo(env) {
    return {
        name: 'sheet-seo',
        apply: 'build',
        async transformIndexHtml(html) {
            let sheet
            try {
                sheet = await readSheet(env)
            } catch (err) {
                this.warn(`sheet-seo: could not read the sheet (${err.message}); leaving index.html as written`)
                return html
            }
            if (!sheet) {
                this.warn('sheet-seo: SPREADSHEET_ID / GOOGLE_CREDENTIALS not set; leaving index.html as written')
                return html
            }

            const about = sheet.about[0] || {}
            const home = sheet.home[0] || {}
            const education = sheet.education[0] || {}

            const name = home.name || ''
            const headline = name && home.subtitle ? `${name} — ${home.subtitle}` : ''
            const pitch = clamp(home.description || about.bio)

            // keep whatever keyword tail index.html put after the pipe — it is read
            // back out of the file, so it is already escaped and must not be again
            const tail = (html.match(/<title>[^<|]*\|([^<]*)<\/title>/) || [])[1]
            if (headline) {
                html = html.replace(/<title>[^<]*<\/title>/, `<title>${attr(headline)}${tail ? ` |${tail}` : ''}</title>`)
            }

            html = setMeta(html, 'name', 'description', pitch)
            html = setMeta(html, 'property', 'og:title', headline)
            html = setMeta(html, 'property', 'og:description', pitch)
            html = setMeta(html, 'property', 'og:image:alt', headline)
            html = setMeta(html, 'name', 'twitter:title', headline)
            html = setMeta(html, 'name', 'twitter:description', pitch)

            // merge into the existing Person block so hand-written fields survive
            html = html.replace(
                /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/,
                (whole, open, body, close) => {
                    let ld
                    try {
                        ld = JSON.parse(body)
                    } catch {
                        this.warn('sheet-seo: JSON-LD block is not valid JSON; leaving it as written')
                        return whole
                    }

                    if (name) ld.alternateName = name
                    if (about.email) ld.email = `mailto:${about.email}`
                    if (home.subtitle) ld.jobTitle = home.subtitle
                    if (about.bio) ld.description = clamp(about.bio, 300)
                    if (education.school) ld.alumniOf = { '@type': 'CollegeOrUniversity', name: education.school }

                    const skills = [...new Set(
                        sheet.skills.flatMap(r => (r.skills || '').split(',').map(x => x.trim()).filter(Boolean)),
                    )]
                    if (skills.length) ld.knowsAbout = skills.slice(0, 15)

                    const profiles = [
                        about.linkedin && `https://${about.linkedin.replace(/^https?:\/\//, '')}`,
                        about.github && `https://github.com/${about.github}`,
                    ].filter(Boolean)
                    const kept = (ld.sameAs || []).filter(u => !/linkedin\.com|github\.com/i.test(u))
                    if (profiles.length) ld.sameAs = [...profiles, ...kept]

                    // < keeps a stray "</script>" in the data from closing the tag early
                    return open + '\n' + JSON.stringify(ld, null, 2).replace(/</g, '\\u003c') + '\n    ' + close
                },
            )

            return html
        },
    }
}
