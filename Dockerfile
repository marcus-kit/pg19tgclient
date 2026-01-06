# Nuxt 4 Production Dockerfile
# Multi-stage build for minimal image size

# Build stage
FROM node:22-alpine AS builder

# Build-time config (public variables baked into client bundle)
ARG SUPABASE_URL
ARG SUPABASE_KEY
ARG TELEGRAM_BOT_USERNAME

ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_KEY=${SUPABASE_KEY}
ENV TELEGRAM_BOT_USERNAME=${TELEGRAM_BOT_USERNAME}

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Copy only the built output
COPY --from=builder /app/.output ./.output

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
