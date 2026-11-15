# MumbaAai

Your city. Your Aai. A Mumbai/MMR super-app: live weather and AQI, news, traffic, local train and Metro info, jobs, Mumbaa Radio, and Ask Aai, a multilingual AI guide (English, Hindi, Marathi).

Live app: https://mumbaaai777.github.io/mumbaaai/

## Structure
- `apps/web` — Vite + React PWA
- `apps/admin` — admin panel (in progress)
- `packages/shared` — shared types, data, i18n, radio schedule
- `workers/api` — Cloudflare Worker (Gemini proxy, RSS news)

## Run
```
npm install
npm run dev
npm run build:pages   # builds pages-dist/ for GitHub Pages
```
