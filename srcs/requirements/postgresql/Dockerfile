# syntax=docker/dockerfile:1
# escape=\

FROM postgres@sha256:7b86711ac72674c8f2cf0fad7fd55cb07ae709c62fa0cddfa78e28e985fffe09

ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=mdp
ENV POSTGRES_DB=postgres

RUN apk update && apk upgrade && apk add vim

#COPY ./tools/i.sh /docker-entrypoint-initdb.d/init.sh
#RUN chown postgres /docker-entrypoint-initdb.d/init.sh && chmod +x /docker-entrypoint-initdb.d/init.sh

#COPY ./tools/init.sql /docker-entrypoint-initdb.d/init.sql
#RUN chown postgres /docker-entrypoint-initdb.d/init.sql

USER postgres

RUN initdb

RUN rm /var/lib/postgresql/data/postgresql.conf /var/lib/postgresql/data/pg_hba.conf

COPY ./conf/postgresql.conf /var/lib/postgresql/data/postgresql.conf
COPY ./conf/pg_hba.conf /var/lib/postgresql/data/pg_hba.conf


EXPOSE 5432

CMD ["postgres"]
