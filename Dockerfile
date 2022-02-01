FROM node:16.13.2-alpine3.15

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN export $(cat .env) && npm install

COPY . .

CMD export $(cat .env) && node app.js