FROM nginx:latest

LABEL maintainer="robertoachar@gmail.com"

COPY ./.docker/nginx.conf /etc/nginx/nginx.conf

COPY ./certs /etc/nginx/certs/

EXPOSE 80
