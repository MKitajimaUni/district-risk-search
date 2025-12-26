# Use official Node image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the app
COPY . .

# Render sets PORT automatically
ENV NODE_ENV=production

# Expose port (optional but recommended)
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
