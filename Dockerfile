# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files separately for caching layers
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app's source code
COPY . .

# Use environment variables from a .env file (optional)
# Uncomment the line below only if you’re using dotenv-cli in your script
# RUN npm install -g dotenv-cli

# Expose the port your app runs on
EXPOSE 5000

# Set environment variable for production
ENV NODE_ENV=production

# Start the server
CMD ["node", "src/server.js"]
