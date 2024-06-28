# Build stage
FROM node:20-alpine AS build

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

RUN npm ci

# Bundle app source
COPY . .
# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Create app directory
WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy only the necessary files from the builder stage
COPY --from=build /app/.build ./.build

# Add curl for health check
RUN apk --no-cache add curl

# Your app binds to port 4000 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 4000

# Add health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/healthcheck || exit 1

# Define the command to run your app using CMD which defines your runtime
CMD [ "node", "./.build/index.js" ]
