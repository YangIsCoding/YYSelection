# Vercel Blob 圖片上傳設定指引

## 🚀 一站式雲端上傳方案

使用 **Vercel Blob** 提供完整的一站式圖片上傳體驗，管理員可直接拖曳上傳，無需複雜設定。

## ⚙️ 初次設定步驟

### 1. 建立 Vercel Blob Store

1. **登入 Vercel Dashboard**
   - 前往 [vercel.com](https://vercel.com)
   - 登入你的帳號

2. **選擇專案**
   - 點選 `yyselection` 專案

3. **建立 Blob Store**
   - 點選 **Storage** 頁籤
   - 點選 **Create Database**
   - 選擇 **Blob**
   - 輸入名稱：`yyselection-images`
   - 點選 **Create**

4. **取得存取令牌**
   - 建立完成後，點選 **Settings**
   - 複製 `BLOB_READ_WRITE_TOKEN` 的值

### 2. 設定環境變數

#### 在 Vercel Dashboard 設定（生產環境）：
1. 專案頁面 → **Settings** → **Environment Variables**
2. 新增變數：
   ```
   Key: BLOB_READ_WRITE_TOKEN
   Value: vercel_blob_rw_xxxxxxxxxxxxxxxxx
   ```
3. 選擇 **Production** 環境
4. 點選 **Save**

#### 本地開發環境設定：
在 `.env.local` 檔案中加入：
```bash
# Vercel Blob 設定
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxx
```

### 3. 重新部署
設定完成後，在 Vercel Dashboard 中點選 **Redeploy** 讓變更生效。

## 🎯 日常使用說明

### 管理員上傳圖片

1. **登入管理後台**
   - 使用 ADMIN 帳號登入系統

2. **選擇上傳方式**
   - **檔案選擇**：點選「選擇圖片」按鈕
   - **拖曳上傳**：直接將圖片拖拽到上傳區域

3. **支援格式與限制**
   - 格式：JPEG、PNG、WebP
   - 單檔大小：最大 5MB
   - 數量限制：最多 10 張

4. **自動處理**
   - 圖片自動上傳到 Vercel Blob
   - 取得永久 CDN URL
   - 立即在網站中顯示

## 📸 技術細節

### 圖片 URL 格式
```
https://xxx.public.blob.vercel-storage.com/檔案名-隨機ID.jpg
```

### 儲存位置
- **雲端儲存**：Vercel Blob (AWS S3 相容)
- **CDN 加速**：全球邊緣節點快速載入
- **永久保存**：不會因為部署而消失

### 安全性
- **權限控制**：只有 ADMIN 可以上傳
- **檔案驗證**：檢查檔案類型和大小
- **公開存取**：圖片 URL 可直接訪問

## 🔧 故障排除

### 常見錯誤與解決方案

#### 1. "Vercel Blob 未設定" 錯誤
**原因**：缺少 `BLOB_READ_WRITE_TOKEN` 環境變數
**解決**：
1. 檢查 Vercel Dashboard 環境變數設定
2. 確認 Token 值正確
3. 重新部署專案

#### 2. "權限檢查失敗" 錯誤
**原因**：用戶無 ADMIN 權限
**解決**：
1. 確認已登入系統
2. 檢查用戶角色是否為 ADMIN
3. 聯絡系統管理員升級權限

#### 3. "檔案上傳失敗" 錯誤
**可能原因**：
- 檔案太大（超過 5MB）
- 檔案格式不支援
- 網路連線問題
**解決**：
1. 檢查檔案大小和格式
2. 重新嘗試上傳
3. 檢查網路連線

## 💰 費用說明

### Vercel Blob 計費方式
- **目前狀態**：Beta 階段，暫時免費
- **未來計費**（預估）：
  - 儲存：$0.023/GB/月
  - 傳輸：$0.050/GB
  - 操作：$5.00/百萬次

### 小型電商預估費用
- **圖片儲存**：約 1-5GB → $0.02-0.12/月
- **流量傳輸**：約 10-50GB → $0.50-2.50/月
- **總計預估**：$1-5/月

相比其他方案（Cloudinary $99/月），Vercel Blob 非常經濟實惠！

## 📞 支援資源

- **Vercel Blob 文檔**：[vercel.com/docs/storage/vercel-blob](https://vercel.com/docs/storage/vercel-blob)
- **API 參考**：[@vercel/blob SDK](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk)
- **社群支援**：[Vercel Discord](https://vercel.com/discord)

---

✨ **現在你的電商網站已具備專業級的圖片上傳功能！管理員可以輕鬆上傳圖片，客戶可以享受快速的圖片載入體驗。**