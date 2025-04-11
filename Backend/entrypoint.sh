#!/bin/sh

echo "DATABASE_HOST is: $DATABASE_HOST"

echo "Waiting for PostgreSQL to be ready..."
while ! nc -z $DATABASE_HOST 5432; do
  sleep 0.1
done
echo "PostgreSQL is up and running."

redis-server --daemonize yes
sleep 2
redis-cli -h 127.0.0.1 -p 6379 keys "room:*:*" | xargs -r redis-cli del
redis-cli -h 127.0.0.1 -p 6379 keys "tournament:*:*" | xargs -r redis-cli del

python manage.py makemigrations user match tmatch
python manage.py migrate


#python manage.py runserver_plus --cert-file transcendence.pem --key-file transcendence.key 0.0.0.0:8001
echo "Starting UVicorn..."
uvicorn backend.asgi:application --host 0.0.0.0 --port 8001 --ssl-certfile /etc/ssl/transcendence.pem --ssl-keyfile /etc/ssl/transcendence.key --proxy-headers
