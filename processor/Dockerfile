FROM node:22.2-alpine

WORKDIR /usr/src/app/yt-video-updater/processor

COPY package.json ./
COPY package-lock.json ./

# Install dependencies and fontconfig using apk
RUN npm install && \
    apk update && \
    apk add --no-cache fontconfig

COPY . .

EXPOSE 2003

CMD ["npm", "run", "dev"]