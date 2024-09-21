#!/bin/sh

source /django_web_app/env/bin/activate

python3 manage.py migrate --no-input
python3 manage.py collectstatic --no-input

DJANGO_SUPERUSER_PASSWORD=$SUPER_USER_PASSWORD python manage.py createsuperuser --username $SUPER_USER_NAME --email $SUPER_USER_EMAIL --noinput

gunicorn game.wsgi:application --bind 0.0.0.0:8000
