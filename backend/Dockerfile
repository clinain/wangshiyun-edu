FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN apk add --no-cache curl

EXPOSE 3000

CMD ["sh", "-c", "npm run dev"]
