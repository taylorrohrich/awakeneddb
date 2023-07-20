FROM node:18 as build
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY index.ts ./
COPY helpers.ts ./
COPY global.d.ts ./
COPY middleware.ts ./
COPY tsconfig.json ./
COPY types.ts ./
COPY routes ./routes
COPY profanity_corpus.ts ./
RUN npm run build

FROM node:18 as start

WORKDIR /app
COPY package*.json ./
COPY --from=build /app/build ./
RUN npm install --production
EXPOSE 8080
CMD [ "forever", "start", "index.js" ]