FROM node:20-alpine AS builder
WORKDIR /app

# 1. Install dependencies
COPY package*.json ./
RUN npm install

# 2. Copy source and build
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 3. Final Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy everything from builder to ensure consistency
COPY --from=builder /app ./

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "start"]
