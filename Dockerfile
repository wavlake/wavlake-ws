FROM node:16.8.0

WORKDIR /usr/src/app

COPY package*.json ./
COPY controller/ controller
COPY db/ db
COPY libraries/ libraries
COPY routes/ routes
COPY index.js index.js

RUN npm install

EXPOSE 3001
CMD ["npm", "start"]