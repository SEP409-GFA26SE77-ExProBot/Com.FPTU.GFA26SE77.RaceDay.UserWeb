FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json package-lock.json* ./

RUN npm i

COPY . .

RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "start"]