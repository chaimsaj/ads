# --- Build ---
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# --- Production Dependencies ---
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev
RUN npx prisma generate

# --- Runner ---
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV PORT=80

ENV DATABASE_URL=mongodb+srv://myngly_ads:dPpPEnXbYdwlvMYr@myngly-cluster.mszvq4s.mongodb.net/myngly_ads
ENV JWT_ACCESS_SECRET=8a19eea3e510c0da1f7ff8a98130a6eadf6f78574062fc993fbcbfb5497bebf1a30633d3c19482f8194ef98c0475c1c248bcbcbe89738c5154c234b2a19bbdbc
ENV JWT_REFRESH_SECRET=b7d667636680a8c8fa8a3d8659076bd669e416d1df9f35865553710804f4fc810c80a1d9689abc69a88129ef1d33ea8ee66a8c0c60bc9a92f9d771d120fff6d4
ENV JWT_ACCESS_EXPIRES_IN=90m
ENV JWT_REFRESH_EXPIRES_IN=15d
ENV CORS_ORIGINS=https://myngly-ads-webapp-d9djeybteubqbwan.eastus-01.azurewebsites.net,https://myngly-ads-admin-ffbwe4d9avauapf9.eastus-01.azurewebsites.net
ENV STRIPE_SECRET_KEY=sk_test_51P0uN4JuwDcv97aR0GZxKbuJM9BChp8MXCh1s8D1mYlkV8zwkcA7Y8MCr2qQ56eoAHlVOJJ3gHBZJSowKk6zqBNl00NbWOWq1M
ENV STRIPE_PUBLISHABLE_KEY=pk_test_51P0uN4JuwDcv97aRCTFWrXxdJ1V8WpsWZUyBA1LnniD5oJPUkYbueaDJhCa9MBnF5kQbwQNtFU94PfjC5rTAEvLS009SfCbZPx
ENV SENDGRID_API_KEY=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
ENV SENDGRID_FROM_EMAIL=noreply@myngly.com
ENV SENDGRID_FROM_NAME='Myngly Ads'
ENV APP_URL=https://myngly-ads-webapp-d9djeybteubqbwan.eastus-01.azurewebsites.net
ENV ADMIN_URL=https://myngly-ads-admin-ffbwe4d9avauapf9.eastus-01.azurewebsites.net
ENV COOKIE_SECURE=true

RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

EXPOSE 80

CMD ["node", "dist/index.js"]
