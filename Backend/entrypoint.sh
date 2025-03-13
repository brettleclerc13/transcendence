#!/bin/sh

echo "DATABASE_HOST is: $DATABASE_HOST"

echo "Waiting for PostgreSQL to be ready..."
while ! nc -z $DATABASE_HOST 5432; do
  sleep 0.1
done
echo "PostgreSQL is up and running."

redis-server --daemonize yes
redis-cli -h 127.0.0.1 -p 6379 keys "room:*:*" | xargs -r redis-cli del

echo "Applying migrations..."
python manage.py makemigrations user
python manage.py migrate

#python manage.py runserver_plus --cert-file transcendence.pem --key-file transcendence.key 0.0.0.0:8001
echo "Starting Daphne..."
daphne -b 0.0.0.0 -p 8001 backend.asgi:application -v2
