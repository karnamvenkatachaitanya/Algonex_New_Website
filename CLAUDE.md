# Algonex Platform

## Project Structure
- `algonex-backend/` — Django 5.x REST API (DRF)
- `algonex-frontend/` — React 19 + Vite + Ant Design SPA

## Backend (complete)
- **Run:** `cd algonex-backend && python3.11 manage.py runserver`
- **Test:** `cd algonex-backend && python3.11 -m pytest -v` (91 tests)
- **Seed data:** `python3.11 manage.py seed_courses`
- Architecture: 4-layer per app (views → services → selectors → models)
- Apps: accounts, courses, events, careers, portfolio, contactform
- All API under `/api/v1/`

## Frontend Integration
- **READ THIS:** `docs/backend-api-integration.md` has every endpoint, request/response format, and auth flow
- Base URL: `http://localhost:8000/api/v1` (set `VITE_API_URL` in `.env`)
- Auth: JWT Bearer tokens via `Authorization: Bearer <token>`
- Response format: `{ "status": "success", "data": {...} }` or `{ "status": "error", "error": {...} }`

## Commands
- Backend tests: `cd algonex-backend && python3.11 -m pytest -v`
- Frontend dev: `cd algonex-frontend && npm run dev`
- Frontend build: `cd algonex-frontend && npm run build`
