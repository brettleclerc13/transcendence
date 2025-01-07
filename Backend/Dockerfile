FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libpq-dev gcc curl openssl netcat-traditional -y && apt-get install -y libpq-dev gcc redis-server && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
COPY entrypoint.sh .

RUN openssl req -x509 -nodes -out transcendence.pem -keyout transcendence.key \
    -subj "/C=FR/ST=Seine-et-Marne/L=Vernou/O=Ecole\ 42/OU=Ecole/CN=transcendence.fr/emailAddress=bleclerc@student.42nice.fr"

RUN pip install django-extensions Werkzeug daphne djangorestframework-simplejwt

#COPY . .

RUN pip install --no-cache-dir -r requirements.txt

RUN chmod +x /app/entrypoint.sh

EXPOSE 8001

CMD ["/app/entrypoint.sh"]
