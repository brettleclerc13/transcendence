FROM node:23-alpine-slim@sha256:86703151a18fcd06258e013073508c4afea8e19cd7ed451554221dd00aea83fc

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .
ENV NODE_EXTRA_CA_CERTS=/etc/nginx/ssl/transcendence.pem


#RUN npm run build

#EXPOSE 3000

#CMD ["npm", "run", "start"]
CMD ["npm", "run", "dev"]
