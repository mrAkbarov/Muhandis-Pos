# Muhandis Pos — monorepo

```
pos-project/
├── backend/          # Django + DRF API
├── frontend/         # React + Vite (Bun)
└── compose.yaml        # faqat PostgreSQL (lokal DB)
```

## Lokal ishga tushirish

**Backend:**
```bash
cd backend
cp .env.example .env
uv sync
uv run python manage.py migrate
uv run python manage.py seed_pos_demo
uv run python manage.py runserver
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
bun install
bun run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Docker (tavsiya — hammasi bir buyruqda)

PostgreSQL + backend + frontend birga:

```bash
docker compose up --build
```

yoki:

```bash
make docker-up
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- PostgreSQL (host): `127.0.0.1:5433`

Birinchi marta demo ma'lumot kerak bo'lsa, `docker-compose.yaml` ichida `SEED_DEMO: "1"` qiling yoki:

```bash
docker compose exec backend uv run python manage.py seed_pos_demo
```

To'xtatish: `Ctrl+C` yoki `docker compose down`

---

## Lokal ishga tushirish (ixtiyoriy)

Docker ishlatmasangiz — backend va frontend alohida terminalda:

```bash
make docker-up          # faqat postgres
make run                # backend (boshqa terminal)
make frontend-dev       # frontend (boshqa terminal)
```
