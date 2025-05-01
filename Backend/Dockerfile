FROM python:3.13-alpine-slim@sha256:18159b2be11db91f84b8f8f655cd860f805dbd9e49a583ddaac8ab39bf4fe1a7

WORKDIR /app

RUN apk update && apk add --no-cache libpq-dev gcc curl openssl netcat-openbsd redis file libmagic && rm -rf /var/cache/apk/*

COPY requirements.txt .
COPY entrypoint.sh .

RUN openssl req -x509 -nodes -out /etc/ssl/transcendence.pem -keyout /etc/ssl/transcendence.key \
    -subj "/C=FR/ST=Seine-et-Marne/L=Vernou/O=Ecole\ 42/OU=Ecole/CN=transcendence.fr/emailAddress=bleclerc@student.42nice.fr"

RUN pip install django-extensions Werkzeug uvicorn djangorestframework-simplejwt Pillow django-bleach django-otp django-two-factor-auth qrcode

RUN pip install 'uvicorn[standard]'


#COPY . .

RUN pip install --no-cache-dir -r requirements.txt

RUN pip install --upgrade channels

RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
