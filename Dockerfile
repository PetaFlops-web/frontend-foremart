# Stage 1: Build aplikasi React
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files dulu supaya layer ini bisa di-cache
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build untuk production
RUN npm run build

# Stage 2: Serve dengan Nginx
FROM nginx:alpine

# Install wget untuk healthcheck
RUN apk add --no-cache wget

# Hapus default config nginx
RUN rm /etc/nginx/conf.d/default.conf

# Template nginx (akan di-envsubst saat container start)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy entrypoint custom (envsubst terbatas)
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy hasil build dari stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
