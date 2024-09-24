# syntax=docker/dockerfile:1
# escape=\

FROM alpine@sha256:33735bd63cf84d7e388d9f6d297d348c523c044410f553bd878c6d7829612735

#Installing utils
RUN apk update \
    && apk upgrade \
    && apk add vim yarn

RUN mkdir /front

WORKDIR /front

RUN yarn create react-app game

WORKDIR /front/game

EXPOSE 3000

CMD ["yarn", "start"]
