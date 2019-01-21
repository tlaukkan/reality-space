# specify the node base image with your desired version node:<version>
FROM node:alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:lib

EXPOSE 3000

CMD ["node","lib/src/node/app.js"]

USER node

