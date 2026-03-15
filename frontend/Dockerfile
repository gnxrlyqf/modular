FROM node:20-slim AS base

WORKDIR /app

RUN npm install -g nodemon

COPY package*.json .

RUN npm install

# the src directory should be mounted as a volume in docker-compose.yml, so we don't copy it here



# development target
FROM base AS development

WORKDIR /app

COPY ./*config* ./
EXPOSE 5173

CMD ["npm", "run", "dev"]




# production target
FROM base AS builder

WORKDIR /app

COPY ./*config* ./

RUN npm run build



FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]