# --- Build ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mv .env.production .env

RUN npm run build

# --- Runner ---
FROM node:20-alpine AS runner

ENV NODE_ENV=production

RUN npm install -g serve

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env ./

EXPOSE 80

CMD ["serve", "-s", "dist", "-l", "80"]
