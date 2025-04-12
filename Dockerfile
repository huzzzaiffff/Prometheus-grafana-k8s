# Use the official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the app
COPY server.js ./

# Expose the port your server runs on
EXPOSE 8080

# Run the server
CMD ["npm", "start"]
