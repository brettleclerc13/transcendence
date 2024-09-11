# syntax=docker/dockerfile:1
# escape=\

FROM python@sha256:2003de5fe1ed2b09578778c83fc0a6a199a443077b5d9d02a3bd04a6ef5ea9f4

#args of build
ARG APP_DIR=/django_web_app
ARG GAME_DIR=game
ARG ENV_DIR=$APP_DIR/env/bin/activate

#Installing utils
RUN apk update
RUN apk upgrade
RUN apk add vim postgresql-dev postgresql-client gcc python3-dev musl-dev

RUN mkdir django_web_app
WORKDIR $APP_DIR

RUN	python3 -m venv env \
	&& source $ENV_DIR && pip install django \
	&& pip freeze > requirements.txt && django-admin startproject $GAME_DIR

WORKDIR	$APP_DIR/$GAME_DIR

COPY ./conf/settings.py /django_web_app/game/game/settings.py

RUN source $ENV_DIR && pip install psycopg

COPY ./tools/init.sh $APP_DIR/$GAME_DIR/init.sh
RUN chmod +x init.sh

CMD ["./init.sh"]
