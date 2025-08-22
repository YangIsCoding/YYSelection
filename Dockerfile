# 使用 Node.js 18 Alpine 版本作為基底映像檔
# Alpine 是輕量級的 Linux 發行版，映像檔更小更安全
FROM node:18-alpine

# 在容器內建立並設定工作目錄為 /app
# 這是我們應用程式在容器內的家
WORKDIR /app

# 先複製 package.json 和 package-lock.json
# 分開複製可以利用 Docker 的層級快取機制
# 如果 package.json 沒變，Docker 就不會重新安裝依賴
COPY package*.json ./

# 複製 Prisma schema 檔案
# Prisma generate 需要這個檔案
COPY prisma ./prisma

# 安裝 Node.js 依賴套件（包含dev dependencies，因為需要prisma CLI）
# 之後會在生產環境清除dev dependencies
RUN npm ci

# 生成 Prisma 客戶端
# 這是你的專案需要的 ORM 客戶端程式碼
RUN npx prisma generate

# 複製所有專案檔案到容器內的 /app 目錄
# .dockerignore 會排除不需要的檔案（如 node_modules）
COPY . .

# 告訴 Docker 這個容器會使用 3002 埠號
EXPOSE 3002

# 開發環境：使用 npm run dev（支援 hot reload）
# 生產環境：先 build 再 start
CMD ["npm", "run", "dev", "--", "-p", "3002"]