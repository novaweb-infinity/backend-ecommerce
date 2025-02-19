FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts=false --foreground-scripts --verbose sharp

COPY . .

EXPOSE 1337
CMD ["npm", "run", "develop"]