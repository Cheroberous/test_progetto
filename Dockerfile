FROM node:latest

WORKDIR /usr/src/app

COPY ./backend/package*.json ./

RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "backend/start"]