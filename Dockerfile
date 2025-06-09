FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install -g npm@latest
RUN npm install

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV MONGODB_URI=mongodb://mongodb:27017/vo-donate

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
