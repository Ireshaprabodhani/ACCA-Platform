# 1️⃣  Use a lightweight, production‑ready Node image
FROM node:20-alpine

# 2️⃣  Set working directory inside the container
WORKDIR /app

# 3️⃣  Copy dependency manifests first (better build‑cache)
COPY package*.json ./

# 4️⃣  Install only prod‑level dependencies
RUN npm ci --omit=dev

# 5️⃣  Copy the rest of your source code
COPY . .

# 6️⃣  Expose the port your app listens on (server.js uses process.env.PORT || 3000)
EXPOSE 3000

# 7️⃣  Default command — relies on "start" in package.json
CMD ["npm", "start"]
