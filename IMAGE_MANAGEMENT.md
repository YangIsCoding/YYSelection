# 圖片管理指引

## 🎯 簡化方案說明

為了避免複雜的雲端設定，我們採用混合式圖片管理方案：

### 本地開發環境 💻
- **自動上傳**：可以直接上傳圖片到 `public/uploads/` 目錄
- **即時可用**：上傳後立即在網站中顯示

### 生產環境 (Vercel) 🌐
- **手動管理**：需要手動將圖片加入 GitHub 倉庫
- **穩定可靠**：圖片透過 GitHub 提供，永不遺失

## 📝 操作流程

### 1. 本地測試 (開발時)
1. 使用管理後台上傳圖片
2. 圖片會儲存到 `public/uploads/` 目錄
3. 立即可以在網站中查看效果

### 2. 部署到生產環境
1. **準備圖片**：將要使用的圖片收集到一個資料夾
2. **加入 Git**：
   ```bash
   # 將圖片複製到對應目錄
   cp 你的圖片.jpg public/uploads/
   
   # 加入到 Git
   git add public/uploads/
   git commit -m "Add product images"
   git push
   ```
3. **更新資料庫**：在管理後台中直接輸入圖片 URL

### 3. 圖片 URL 格式
- **本地開發**：`/uploads/檔案名.jpg`
- **生產環境**：`/uploads/檔案名.jpg` (相同格式)

## 📁 建議的目錄結構

```
public/
├── uploads/
│   ├── products/
│   │   ├── product-1.jpg
│   │   ├── product-2.jpg
│   │   └── ...
│   ├── banners/
│   │   ├── banner-1.jpg
│   │   ├── banner-2.jpg
│   │   └── ...
│   └── avatars/
│       └── ...
```

## 🔧 管理建議

### 圖片命名規則
- 使用英文和數字
- 避免空格，使用 `-` 或 `_` 分隔
- 包含圖片用途：`product-iphone-15.jpg`

### 圖片大小建議
- **商品圖片**：800x800px，檔案大小 < 500KB
- **廣告橫幅**：1200x400px，檔案大小 < 1MB
- **格式**：JPG（照片）或 PNG（透明背景）

### 批量管理技巧
1. **本地整理**：先在本地目錄整理好所有圖片
2. **批量重新命名**：使用檔案管理器批量重新命名
3. **一次性上傳**：將整理好的圖片一次性加入 Git

## 🚀 快速操作範例

### 新增商品圖片
```bash
# 1. 複製圖片到正確位置
cp ~/Downloads/新商品.jpg public/uploads/product-amazing-gadget.jpg

# 2. 加入 Git
git add public/uploads/product-amazing-gadget.jpg
git commit -m "Add product image: amazing gadget"
git push

# 3. 在管理後台使用 URL: /uploads/product-amazing-gadget.jpg
```

### 新增廣告橫幅
```bash
# 1. 複製廣告圖片
cp ~/Downloads/春節促銷.jpg public/uploads/banner-spring-sale.jpg

# 2. 加入 Git
git add public/uploads/banner-spring-sale.jpg
git commit -m "Add banner: spring sale promotion"
git push

# 3. 在廣告管理中使用 URL: /uploads/banner-spring-sale.jpg
```

## 💡 進階技巧

### 1. 使用 GitHub Desktop
- 更簡單的圖形化介面
- 拖拽即可加入檔案

### 2. 圖片壓縮工具
- [TinyPNG](https://tinypng.com/) - 線上壓縮
- [ImageOptim](https://imageoptim.com/) - Mac 工具
- [RIOT](https://riot-optimizer.com/) - Windows 工具

### 3. 批量重新命名
- **Windows**：PowerToys PowerRename
- **Mac**：Name Mangler 或 Finder 批量重新命名
- **線上工具**：Bulk Rename Utility

## ⚠️ 注意事項

1. **檔案大小**：避免上傳過大的圖片影響載入速度
2. **版權問題**：確保使用的圖片有合法授權
3. **備份**：重要圖片建議額外備份
4. **命名衝突**：避免使用重複的檔案名稱

這個方案簡單、可靠，適合小型電商網站使用！