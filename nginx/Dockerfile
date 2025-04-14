FROM nginx:1.27.4-alpine-slim@sha256:b05aceb5ec1844435cae920267ff9949887df5b88f70e11d8b2871651a596612

RUN apk update && apk upgrade && apk add vim openssl

RUN mkdir -p /etc/nginx/ssl

COPY openssl.cnf /etc/nginx/ssl/openssl.cnf

RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/transcendence.key \
    -out /etc/nginx/ssl/transcendence.pem \
    -config /etc/nginx/ssl/openssl.cnf \
    -extensions v3_req

COPY trance.conf /etc/nginx/conf.d/default.conf
