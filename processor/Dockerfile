FROM node:22.2-alpine

WORKDIR /usr/src/app/yt-video-updater/processor

COPY package.json ./
COPY package-lock.json ./

RUN apk update && apk add build-base \
    g++ \
    cairo-dev \
    pango-dev \
    giflib-dev \
    freetype-dev \
    libpng-dev \
    jpeg-dev \
    libjpeg-turbo-dev

RUN npm install

COPY . .

EXPOSE 2003

CMD ["npm", "run", "dev"]