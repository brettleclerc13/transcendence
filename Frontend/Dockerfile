FROM node:23-alpine-slim@sha256:86703151a18fcd06258e013073508c4afea8e19cd7ed451554221dd00aea83fc

WORKDIR /app

COPY package.json ./
COPY . .


RUN npm install
RUN apk add --no-cache openssl
RUN mkdir -p certs




RUN openssl req -x509 -nodes -newkey rsa:2048 -out certs/server.crt -keyout certs/server.key \
-subj "/C=FR/ST=Seine-et-Marne/L=Vernou/O=Ecole\ 42/OU=Ecole/CN=transcendence.fr/emailAddress=ehouot@student.42nice.fr"

RUN cat /app/certs/server.crt > /etc/ssl/certs/combined.pem

# Tell Node to trust the combined certs
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/combined.pem
ARG NEXT_PUBLIC_WS_HOST
ARG NEXT_PUBLIC_WS_PORT
ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_WS_HOST=$NEXT_PUBLIC_WS_HOST
ENV NEXT_PUBLIC_WS_PORT=$NEXT_PUBLIC_WS_PORT
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL


RUN npm run build

CMD ["npm", "run", "start"]
# CMD ["npm", "run", "dev"]
