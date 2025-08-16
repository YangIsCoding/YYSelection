#!/bin/bash

# 資料庫備份腳本
# 使用方法: ./scripts/backup-db.sh

# 設定變數
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_FILE="prisma/dev.db"

# 建立備份目錄
mkdir -p $BACKUP_DIR

# 備份資料庫
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/backup_$DATE.db"
    echo "✅ 資料庫備份完成: $BACKUP_DIR/backup_$DATE.db"
    
    # 保留最近 30 天的備份
    find $BACKUP_DIR -name "backup_*.db" -mtime +30 -delete
    echo "🧹 清理 30 天前的舊備份"
else
    echo "❌ 找不到資料庫檔案: $DB_FILE"
    exit 1
fi

# 驗證備份檔案
BACKUP_SIZE=$(stat -f%z "$BACKUP_DIR/backup_$DATE.db" 2>/dev/null || stat -c%s "$BACKUP_DIR/backup_$DATE.db" 2>/dev/null)
if [ "$BACKUP_SIZE" -gt 0 ]; then
    echo "✅ 備份檔案大小: $BACKUP_SIZE bytes"
else
    echo "❌ 備份檔案可能損壞"
    exit 1
fi