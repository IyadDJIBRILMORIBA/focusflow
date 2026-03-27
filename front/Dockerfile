FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY tsconfig.json vite.config.ts index.html ./
COPY firebase-applet-config.json ./
COPY src ./src

RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
