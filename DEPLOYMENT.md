# YYSelection Vercel 部署指南

## 📋 部署前檢查清單

### ✅ 硬編碼問題已解決
- [x] ADMIN_EMAIL 改為環境變數
- [x] 無硬編碼 localhost URL
- [x] 無其他敏感資訊硬編碼

### ✅ 配置檔案已建立
- [x] `.env.example` - 環境變數範例
- [x] `vercel.json` - Vercel 配置
- [x] `schema.prisma` - 已改為 PostgreSQL

## 🚀 部署步驟

### 步驟 1: 準備 GitHub Repository

```bash
# 1. 初始化 Git（如果還沒有）
git init

# 2. 添加所有檔案
git add .

# 3. 提交變更
git commit -m "準備 Vercel 部署"

# 4. 推送到 GitHub
git remote add origin https://github.com/your-username/yyselection.git
git branch -M main
git push -u origin main
```

### 步驟 2: 設定 PostgreSQL 資料庫

#### 選項 A: 使用 Vercel Postgres (推薦)

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點擊 "Storage" → "Create Database" → "Postgres"
3. 選擇地區：建議選擇 Hong Kong 或 Singapore
4. 記錄連線資訊

#### 選項 B: 使用免費 PostgreSQL 服務

**Supabase:**
1. 登入 [Supabase](https://supabase.com)
2. 建立新專案
3. 取得 DATABASE_URL

**Neon:**
1. 登入 [Neon](https://neon.tech)
2. 建立新專案
3. 取得連線字串

**Railway:**
1. 登入 [Railway](https://railway.app)
2. 部署 PostgreSQL 服務
3. 取得 DATABASE_URL

### 步驟 3: 設定 Google OAuth

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 Google+ API
4. 建立 OAuth 2.0 憑證：
   - 應用程式類型：網頁應用程式
   - 授權重新導向 URI：
     - `https://your-domain.vercel.app/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (開發用)
5. 記錄 Client ID 和 Client Secret

### 步驟 4: 部署到 Vercel

1. 登入 [Vercel Dashboard](https://vercel.com)
2. 點擊 "Add New..." → "Project"
3. 選擇你的 GitHub repository
4. 框架預設：Next.js ✅
5. 不需要修改 Build 和 Output 設定

### 步驟 5: 設定環境變數

在 Vercel 專案設定中添加以下環境變數：

```bash
# 資料庫
DATABASE_URL=postgresql://username:password@hostname:port/database

# NextAuth
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=a-random-secret-at-least-32-characters

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 管理員
ADMIN_EMAIL=your-admin-email@gmail.com
```

#### 生成 NEXTAUTH_SECRET

```bash
# 使用 OpenSSL
openssl rand -base64 32

# 或者使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 步驟 6: 資料庫初始化

部署完成後，需要執行資料庫 migration：

1. 在 Vercel Dashboard 中打開專案
2. 進入 "Functions" 頁籤
3. 找到任一 API 函數並點擊 "View Function"
4. 或者使用 Vercel CLI：

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入
vercel login

# 連結專案
vercel link

# 執行 migration
vercel env pull .env.local
npx prisma migrate deploy
```

### 步驟 7: 測試部署

1. 訪問你的 Vercel URL
2. 測試 Google 登入功能
3. 確認管理員身份正確
4. 測試核心功能：
   - 商品瀏覽
   - 聊天功能  
   - 訂單管理

## 🔧 常見問題解決

### 問題 1: Prisma Client 錯誤

```bash
# 症狀：PrismaClientInitializationError
# 解決：確保環境變數正確設定
DATABASE_URL=postgresql://...
```

### 問題 2: 資料庫連線失敗

1. 檢查 DATABASE_URL 格式
2. 確認資料庫允許外部連線
3. 檢查 IP 白名單設定

### 問題 3: Google OAuth 錯誤

1. 確認 redirect URI 正確
2. 檢查 Google Cloud Console 設定
3. 驗證 NEXTAUTH_URL 設定

### 問題 4: 檔案上傳問題

Vercel 是無伺服器環境，檔案上傳建議：
1. 使用 Vercel Blob Storage
2. 或整合 Cloudinary
3. 或使用 AWS S3

## 📊 效能優化建議

### 1. 圖片優化

```typescript
// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-image-domain.com'],
    formats: ['image/webp'],
  },
}

export default nextConfig
```

### 2. 資料庫優化

```sql
-- 建立必要索引
CREATE INDEX idx_product_category ON "Product"(category);
CREATE INDEX idx_order_user_id ON "Order"(userId);
CREATE INDEX idx_message_chat_id ON "Message"(chatId);
```

### 3. 快取策略

```typescript
// API 路由中使用快取
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
    }
  })
}
```

## 🚨 安全性檢查

- [x] 環境變數不在程式碼中
- [x] .env 檔案在 .gitignore 中
- [x] 使用 HTTPS（Vercel 自動提供）
- [x] CSRF 保護（NextAuth 內建）
- [x] 資料庫連線加密

## 📈 監控設定

1. **Vercel Analytics**
   - 在專案設定中啟用
   - 監控頁面效能

2. **Sentry 錯誤追蹤**
   ```bash
   npm install @sentry/nextjs
   ```

3. **Uptime 監控**
   - 使用 UptimeRobot 或類似服務
   - 監控關鍵 API 端點

## 🔄 持續部署

Vercel 會自動部署：
- `main` 分支 → 生產環境
- 其他分支 → 預覽環境

建議工作流程：
1. 功能開發在 `feature` 分支
2. 合併到 `develop` 分支測試
3. 測試通過後合併到 `main` 分支部署

## 📝 部署完成檢查清單

- [ ] 網站可正常訪問
- [ ] Google 登入功能正常
- [ ] 管理員權限正確
- [ ] 資料庫讀寫正常
- [ ] 圖片上傳功能
- [ ] 聊天功能
- [ ] 訂單建立流程
- [ ] 手機版本相容性
- [ ] 頁面載入速度 < 3秒
- [ ] 無 Console 錯誤

🎉 **恭喜！YYSelection 已成功部署到 Vercel！**