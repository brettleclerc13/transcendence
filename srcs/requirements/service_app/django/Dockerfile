# syntax=docker/dockerfile:1
# escape=\

FROM python@sha256:2003de5fe1ed2b09578778c83fc0a6a199a443077b5d9d02a3bd04a6ef5ea9f4

#args of build
ARG APP_DIR=/django_web_app
ARG PROJECT_DIR=game
ARG ENV_DIR=$APP_DIR/env/bin/activate

#Installing utils
RUN apk update \
    && apk upgrade \
    && apk add vim postgresql-dev postgresql-client gcc python3-dev musl-dev

RUN mkdir $APP_DIR /static
WORKDIR $APP_DIR

RUN	python3 -m venv env \
	&& source $ENV_DIR \
    && pip install --upgrade pip \
    && pip install django psycopg gunicorn djangorestframework kafka-python \
	&& pip freeze > requirements.txt \
    && django-admin startproject $PROJECT_DIR

WORKDIR	$APP_DIR/$PROJECT_DIR

RUN source $ENV_DIR \
    && python3 manage.py startapp pong

COPY ./conf/settings.py ./$PROJECT_DIR/settings.py

COPY ./tools/models.py ./pong/models.py
COPY ./tools/serializers.py ./pong/serializers.py
COPY ./tools/views.py ./pong/views.py

COPY ./tools/urls.py ./game/urls.py

COPY ./tools/init.sh ./init.sh
RUN chmod +x init.sh

EXPOSE 8000

CMD ["./init.sh"]
