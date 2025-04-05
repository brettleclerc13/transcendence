FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

RUN npm install chart.js react-chartjs-2

RUN npm install --save-dev @types/node

COPY . .


#RUN npm run build

EXPOSE 3000

#CMD ["npm", "run", "start"]
CMD ["npm", "run", "dev"]
