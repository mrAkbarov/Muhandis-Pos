PHONY: mig seed seed-stores seed-bulk seed-magazin-ecosystem seed-magazin-products seed-magazin-suppliers seed-magazin-sales run frontend docker-env docker-up docker-down docker-logs clean lint format dev-sync

dev-sync:
	cd backend && uv sync --all-groups

lint:
	cd backend && uv run ruff check apps root
	cd backend && uv run ruff format --check apps root

format:
	cd backend && uv run ruff format apps root
	cd backend && uv run ruff check --fix apps root

mig:
	cd backend && uv run python manage.py makemigrations
	cd backend && uv run python manage.py migrate

seed:
	cd backend && uv run python manage.py seed_pos_demo

seed-stores:
	cd backend && uv run python manage.py seed_stores --count 100

# To'liq 100 magazin ekotizimi (filial, xodim, mahsulot, diler, qarzdor, sotuv)
seed-magazin-ecosystem:
	cd backend && uv run python manage.py seed_magazin_ecosystem --force

# Tez sinov (2 ta magazin)
seed-magazin-demo:
	cd backend && uv run python manage.py seed_magazin_ecosystem --force --limit-stores 2

seed-bulk:
	cd backend && uv run python manage.py seed_bulk_demo --clear

seed-magazin-products:
	cd backend && uv run python manage.py seed_magazin_ecosystem --force --skip-sales --limit-stores 0

seed-magazin-suppliers:
	cd backend && uv run python manage.py seed_magazin_ecosystem --force --skip-sales --limit-stores 0

seed-magazin-sales:
	cd backend && uv run python manage.py seed_magazin_ecosystem --force --limit-stores 0

patch-magazin-activity:
	cd backend && uv run python manage.py patch_magazin_activity

setup-thermal-printer:
	bash scripts/setup-thermal-printer.sh

test-thermal-print:
	docker compose exec backend uv run python manage.py test_thermal_print

patch-today-sales:
	cd backend && uv run python manage.py patch_today_sales --min-today 18
	cd backend && uv run python manage.py patch_today_sales --min-today 18 --prefix Bulk

# Lokal (Docker siz) — ixtiyoriy
run:
	cd backend && uv run python manage.py runserver

frontend-dev:
	cd frontend && bun run dev

docker-env:
	@test -f backend/.env || cp backend/.env.example backend/.env
	@test -f frontend/.env || cp frontend/.env.example frontend/.env

docker-up: docker-env
	docker compose up --build

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

clean:
	find backend/apps backend/root -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
	find backend/apps backend/root -name '*.pyc' -delete 2>/dev/null || true
