mig:
	python manage.py makemigrations
	python manage.py migrate

seed:
	python manage.py seed_pos_demo

up:
	python manage.py migrate

user:
	python manage.py createsuperuser

run:
	uv run python manage.py runserver

frontend:
	cd Pos && npm run dev

clean:
	find apps root -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
	find apps root -name '*.pyc' -delete 2>/dev/null || true

celery:
	celery -A root worker -l INFO

