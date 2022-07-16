FROM node:latest

WORKDIR /usr/src/app

COPY ./package*.json ./

RUN npm install
RUN npm install -g npm@8.14.0

COPY . .

EXPOSE 3000
CMD ["npm", "start"]