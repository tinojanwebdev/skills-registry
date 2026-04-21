# Codex Project Notes

## Project
- Name: Service Marketplace App
- Stack: React + Vite (frontend), Node.js + Express + MySQL (sample backend)
- Frontend service layer: `src/services/database.service.ts`
- API config: `src/services/api.config.ts`
- Sample backend entry: `src/database/sample-backend.js`

## Local Run
1. Install dependencies
```bash
npm install
```

2. Start backend API (Terminal 1)
```bash
npm run api
```
Expected: API on `http://localhost:3001`

3. Start frontend (Terminal 2)
```bash
npm run dev
```
Expected: app on Vite local URL (commonly `http://localhost:5173`)

## Environment
`.env` should include at minimum:
- `VITE_API_URL=http://localhost:3001/api`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `PORT=3001`

## Common Issues
- `ERR_CONNECTION_REFUSED` on login:
  - Backend is not running. Start with `npm run api`.
- Auth `Failed to fetch`:
  - Confirm frontend `VITE_API_URL` matches backend port and path.
- Build works but runtime fails:
  - Check API payload/response field mapping in UI components.

## Useful Commands
```bash
npm run build
npm run api
npm run dev
```

## Notes
- Frontend and backend are started separately.
- API key/env changes require frontend restart.
