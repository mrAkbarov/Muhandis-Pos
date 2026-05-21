mig:
	python3 manage.py makemigrations
	python3 manage.py migrate
up:
	python manage.py migrate

user:
	python manage.py createsuperuser

apps:
	python manage.py startapp apps

celery:
	celery -A root worker -l INFO

