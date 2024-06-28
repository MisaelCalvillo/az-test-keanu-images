#Build stage
FROM node:20-alpine AS build

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Build TypeScript
RUN npm run build

#Production stage
FROM node:20-alpine AS production

# Create app directory
WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy only the necessary files from the builder stage
COPY --from=build /app/.build ./.build

# Your app binds to port 4000 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 4000

# Define the command to run your app using CMD which defines your runtime
CMD [ "node", "./.build/index.js" ]







