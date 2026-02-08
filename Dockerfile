FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first (Docker layer caching)
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Default port (overridden per service in docker-compose)
EXPOSE 4000

# Default command (overridden per service in docker-compose)
CMD ["npm", "run", "dev:registry"]
