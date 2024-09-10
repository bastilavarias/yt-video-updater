FROM node:22.2-alpine

WORKDIR /usr/src/app/yt-video-updater/processor

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

EXPOSE 2003

CMD ["npm", "run", "dev"]