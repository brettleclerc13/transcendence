# syntax=docker/dockerfile:1
# escape=\

FROM node@sha256:bec402741e59b7f74ddf1b78bff2013c178bebd3b5cf841c202d376d5f1d738a

#Installing utils
RUN apk update \
    && apk upgrade \
    && apk add vim

RUN npx create-next-app@latest transcendence --typescript --eslint --tailwind --src-dir --app --no-import-alias --use-yarn

WORKDIR /transcendence

RUN yarn add axios
RUN yarn install
#RUN yarn build

COPY ./tools/page.tsx ./src/app/page.tsx

EXPOSE 3000

#CMD ["yarn", "start"]
CMD ["yarn", "dev"]
#CMD ["sleep", "infinity"]

#FROM alpine@sha256:33735bd63cf84d7e388d9f6d297d348c523c044410f553bd878c6d7829612735
#
##Installing utils
#RUN apk update \
#    && apk upgrade \
#    && apk add vim yarn
#
#RUN mkdir /front
#
#WORKDIR /front
#
#RUN yarn create react-app game
#
#WORKDIR /front/game
#
#RUN yarn add axios
#RUN yarn install
#RUN yarn run build
#
#EXPOSE 3000
#
#CMD ["yarn", "start"]
