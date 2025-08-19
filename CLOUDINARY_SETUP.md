# Cloudinary 設定指引

## 問題說明
本地圖片上傳功能在部署環境（如 Vercel）中會失敗，因為這些平台不支援寫入檔案系統。我們已經整合了 Cloudinary 雲端儲存服務來解決這個問題。

## 快速設定步驟

### 1. 註冊 Cloudinary 帳號
1. 前往 [Cloudinary](https://cloudinary.com/) 官網
2. 點擊「Sign up for free」註冊免費帳號
3. 完成註冊後，前往 Dashboard

### 2. 取得 API 金鑰
在 Dashboard 頁面，你會看到：
- Cloud name（雲端名稱）
- API Key（API 金鑰）  
- API Secret（API 密鑰）

### 3. 設定環境變數

#### 本地開發環境
在 `.env.local` 檔案中加入（取消註解並替換為實際值）：
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### 生產環境（Vercel）
1. 進入 Vercel 專案設定
2. 前往「Environment Variables」
3. 新增以下變數：
   - `CLOUDINARY_CLOUD_NAME` = 你的雲端名稱
   - `CLOUDINARY_API_KEY` = 你的 API 金鑰
   - `CLOUDINARY_API_SECRET` = 你的 API 密鑰

### 4. 重新部署
設定完環境變數後，重新部署應用程式。

## 功能說明

### 自動後備機制
- **有 Cloudinary 設定**：圖片會上傳到 Cloudinary 雲端
- **沒有 Cloudinary 設定**：在本地環境會使用檔案系統上傳

### 支援的功能
- ✅ 商品圖片上傳（多張圖片）
- ✅ 廣告橫幅上傳
- ✅ 拖拽上傳
- ✅ 圖片預覽
- ✅ 圖片排序

### 免費額度
Cloudinary 免費方案包含：
- 25GB 儲存空間
- 25GB 月流量
- 圖片和影片轉換功能

## 測試上傳功能

設定完成後，你可以：
1. 前往管理員後台的「新增商品」頁面
2. 嘗試上傳圖片
3. 前往「廣告橫幅管理」頁面
4. 測試廣告圖片上傳

如果上傳成功，圖片 URL 會是 Cloudinary 的格式：
`https://res.cloudinary.com/your_cloud_name/image/upload/...`

## 故障排除

### 上傳失敗的可能原因
1. 環境變數設定錯誤
2. Cloudinary API 金鑰無效
3. 網路連線問題
4. 檔案格式不支援

### 檢查方法
1. 查看瀏覽器控制台的錯誤訊息
2. 檢查伺服器日誌
3. 確認環境變數是否正確設定

## 需要協助？
如果遇到問題，請檢查：
1. Cloudinary Dashboard 中的 API 金鑰是否正確
2. 環境變數名稱是否完全一致（大小寫敏感）
3. 是否已重新啟動開發伺服器或重新部署