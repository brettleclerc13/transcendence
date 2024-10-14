# syntax=docker/dockerfile:1
# escape=\

FROM nginx@sha256:0c57fe90551cfd8b7d4d05763c5018607b296cb01f7e0ff44b7d047353ed8cc0

RUN apk update \
    && apk upgrade \
    && apk add vim openssl

RUN mkdir -p /etc/nginx/ssl /static/api /static/chat
RUN openssl req -x509 -nodes \
	-out /etc/nginx/ssl/transcendence.pem \
	-keyout /etc/nginx/ssl/transcendence.key \
	-subj "/C=FR/ST=Alpes-Maritimes/L=Nice/O=Ecole\ 42/OU=Ecole/CN=transcendence.fr/emailAddress=mcordes@student.42nice.fr"

WORKDIR /etc/nginx/conf.d
RUN rm default.conf
COPY ./conf/transcendence_fr.conf ./transcendence_fr.conf

COPY ./tools/init_nginx.sh /tmp/init_nginx.sh
RUN chmod +x /tmp/init_nginx.sh

EXPOSE 443

CMD ["/tmp/init_nginx.sh"]
