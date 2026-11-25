# One image: the built static pages, served by unprivileged nginx on 8080.

FROM node:22-alpine AS web
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web /src/dist /usr/share/nginx/html
# Runs as the non-root "nginx" user.
EXPOSE 8080
