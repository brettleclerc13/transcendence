FROM nginx:1.27.4-alpine-slim@sha256:b05aceb5ec1844435cae920267ff9949887df5b88f70e11d8b2871651a596612

RUN apk update && apk upgrade && apk add vim openssl

RUN mkdir -p /etc/nginx/ssl

RUN openssl req -x509 -nodes -out /etc/nginx/ssl/transcendence.pem -keyout /etc/nginx/ssl/transcendence.key \
    -subj "/C=FR/ST=Alpes-Maritimes/L=Nice/O=Ecole\ 42/OU=Ecole/CN=transcendence.fr/emailAddress=lkukahle@student.42nice.fr"

COPY trance.conf /etc/nginx/conf.d/default.conf

EXPOSE 443