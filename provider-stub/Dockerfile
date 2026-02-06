FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy root-level package.json and package-lock.json for monorepo installs  
# (assuming you use a single root package.json)
COPY ../package*.json ./

# Install dependencies
RUN npm install

# Copy registry service code into the container
COPY . .

# Expose the port the registry service runs on
EXPOSE 4000

# Start the registry service (matches your package.json script)
CMD ["npm", "run", "dev:registry"]