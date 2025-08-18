# 資料庫同步指南

本專案支援在 **Neon PostgreSQL 雲端資料庫** 和 **本地 SQLite 資料庫** 之間進行同步。

## 🎯 使用情境

- **開發階段**：使用本地 SQLite 進行快速開發和測試
- **生產階段**：使用 Neon PostgreSQL 提供穩定的雲端服務
- **資料同步**：在兩個環境之間保持資料一致性

## 📋 可用指令

### 基本同步操作

```bash
# 檢查兩個資料庫的狀態和差異
npm run db:sync:status

# 從 Neon 拉取資料到本地 SQLite
npm run db:sync:pull

# 從本地 SQLite 推送資料到 Neon
npm run db:sync:push
```

### 本地環境設置

```bash
# 設置本地 SQLite 資料庫
npm run db:setup:local

# 重置本地資料庫（清空並重建）
npm run db:reset:local

# 完整的本地開發環境啟動
npm run dev:local
```

## 🚀 快速開始

### 1. 設置本地開發環境

```bash
# 1. 複製環境設定範例
cp .env.local.example .env.local

# 2. 編輯 .env.local，設定本地資料庫連接
# DATABASE_URL="file:./prisma/dev.db"

# 3. 設置本地資料庫
npm run db:setup:local

# 4. 從 Neon 同步資料到本地
npm run db:sync:pull

# 5. 啟動本地開發服務器
npm run dev
```

### 2. 檢查同步狀態

```bash
npm run db:sync:status
```

輸出範例：
```
🔍 檢查資料庫狀態...

📊 Neon PostgreSQL 資料庫:
   👤 users: 5
   📦 products: 6
   🛒 orders: 2
   ⭐ reviews: 3
   ❤️ wishlists: 4

📊 本地 SQLite 資料庫:
   👤 users: 5
   📦 products: 6
   🛒 orders: 2
   ⭐ reviews: 0
   ❤️ wishlists: 0

📈 同步狀態比較:
   ✅ 👤 users: 已同步 (5)
   ✅ 📦 products: 已同步 (6)
   ✅ 🛒 orders: 已同步 (2)
   ⬆️  ⭐ reviews: Neon 多 3 筆
   ⬆️  ❤️ wishlists: Neon 多 4 筆
```

## 🔄 同步策略

### 從雲端到本地 (Pull)
適用於：
- 初始化本地開發環境
- 獲取最新的生產資料
- 重置本地環境

```bash
npm run db:sync:pull
```

### 從本地到雲端 (Push)
適用於：
- 將本地開發的資料推送到生產環境
- 備份本地資料

```bash
npm run db:sync:push
```

⚠️ **注意**: Push 操作會覆蓋雲端資料庫的所有資料！

## 📁 檔案結構

```
scripts/
├── db-sync.ts      # 主要同步邏輯
└── db-status.ts    # 狀態檢查工具

.env                # 生產環境設定 (Neon)
.env.local          # 本地開發環境設定 (SQLite)
.env.local.example  # 本地環境設定範例
```

## 🛠️ 環境切換

### 使用雲端資料庫 (Neon)
```bash
# 使用 .env 檔案 (預設)
npm run dev
```

### 使用本地資料庫 (SQLite)
```bash
# 設置 .env.local 檔案
cp .env.local.example .env.local
npm run dev
```

## ⚠️ 注意事項

1. **資料安全**: Push 操作會完全覆蓋目標資料庫，請謹慎使用
2. **ID 衝突**: 同步過程中會保持原始 ID，確保關聯關係正確
3. **環境變數**: 確認 `.env.local` 檔案設定正確
4. **網路連接**: 同步操作需要穩定的網路連接到 Neon 資料庫

## 🆘 故障排除

### 本地資料庫不存在
```bash
npm run db:reset:local
```

### Neon 連接失敗
- 檢查網路連接
- 確認 DATABASE_URL 設定正確
- 檢查 Neon 資料庫狀態

### 同步失敗
- 執行 `npm run db:sync:status` 檢查狀態
- 查看錯誤訊息
- 嘗試重新初始化: `npm run db:reset:local`

## 📊 支援的資料表

同步工具支援以下所有資料表：
- Users (用戶)
- Products (商品)  
- ProductImages (商品圖片)
- Orders (訂單)
- OrderItems (訂單項目)
- Reviews (評價)
- Wishlists (願望清單)
- Chats (聊天)
- Messages (訊息)
- Notifications (通知)
- StockHistory (庫存歷史)