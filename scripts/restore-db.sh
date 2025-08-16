#!/bin/bash

# 資料庫還原腳本
# 使用方法: ./scripts/restore-db.sh backup_20241201_120000.db

if [ $# -eq 0 ]; then
    echo "❌ 請指定備份檔案"
    echo "使用方法: $0 <備份檔案名稱>"
    echo "可用的備份檔案:"
    ls -la backups/backup_*.db 2>/dev/null || echo "沒有找到備份檔案"
    exit 1
fi

BACKUP_FILE="./backups/$1"
DB_FILE="prisma/dev.db"
RESTORE_BACKUP="./backups/before_restore_$(date +"%Y%m%d_%H%M%S").db"

# 檢查備份檔案是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 備份檔案不存在: $BACKUP_FILE"
    exit 1
fi

# 備份目前的資料庫
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$RESTORE_BACKUP"
    echo "📦 目前資料庫已備份至: $RESTORE_BACKUP"
fi

# 還原資料庫
cp "$BACKUP_FILE" "$DB_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 資料庫還原成功"
    echo "📁 從: $BACKUP_FILE"
    echo "📁 到: $DB_FILE"
    
    # 重新生成 Prisma Client
    npx prisma generate
    echo "🔄 Prisma Client 重新生成完成"
else
    echo "❌ 資料庫還原失敗"
    
    # 如果還原失敗，恢復原始資料庫
    if [ -f "$RESTORE_BACKUP" ]; then
        cp "$RESTORE_BACKUP" "$DB_FILE"
        echo "🔙 已恢復原始資料庫"
    fi
    exit 1
fi