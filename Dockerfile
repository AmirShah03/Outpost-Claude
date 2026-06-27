FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p public/uploads

EXPOSE 3000

CMD ["node", "src/server.js"]
