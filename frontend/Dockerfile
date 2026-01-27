FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

EXPOSE 5173

# Default command (can be overridden by docker-compose)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

