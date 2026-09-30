# Keith Tan: Portfolio Website

**Live:** [keithktan.com](https://keithktan.com)

My personal site (Accountancy & Data Analytics). It's a React single-page app with a built-in content editor and interactive finance tools.

## Sections

- **Home, About/Education, Experience, Skills, Resume:** editable in the browser through an admin mode, with content stored in Google Sheets so updates don't need a redeploy
- **Certifications:** Credly badges fetched through a serverless proxy (to work around CORS)
- **Projects:** pulled live from my GitHub repositories, with filter pills and detail modals
- **Lease calculator** (opened from Projects): interactive IFRS 16 / ASC 842 lease amortization with PV/FV factor tables and Excel export
- **Spending dashboard** (admin only): receipt data captured by [receipt.bot](https://github.com/keith2929/receipt.bot), with a spending map geocoded server-side

## Architecture

```
React (Vite)  ──>  Netlify Functions  ──>  Google Sheets API (site content)
                                     ──>  Credly (badges)
                                     ──>  Nominatim (geocoding)
                                     ──>  Supabase (spending data)
```

## Run locally

```bash
npm install
npm run dev
```

Serverless functions live in `netlify/functions/`. Use `netlify dev` to run them locally with environment variables.

## Tech

React 19 · Vite · Netlify Functions · Google Sheets API · Supabase · Leaflet · ExcelJS
