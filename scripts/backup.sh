#!/bin/bash

# DCA Bot Backup Script
set -e

# Configuration
BACKUP_DIR="./data/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="dca_bot_backup_$DATE"

echo "💾 Starting backup process..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
echo "📊 Backing up database..."
if command -v docker-compose &> /dev/null && docker-compose ps postgres | grep -q "Up"; then
    # PostgreSQL backup (if using Docker)
    docker-compose exec -T postgres pg_dump -U dca_user dca_bot > "$BACKUP_DIR/${BACKUP_NAME}_database.sql"
    echo "✅ Database backup created: ${BACKUP_NAME}_database.sql"
elif [ -f "./backend/data/dca_bot.db" ]; then
    # SQLite backup
    cp "./backend/data/dca_bot.db" "$BACKUP_DIR/${BACKUP_NAME}_database.db"
    echo "✅ SQLite database backup created: ${BACKUP_NAME}_database.db"
else
    echo "⚠️ No database found to backup"
fi

# Backup configuration
echo "⚙️ Backing up configuration..."
if [ -f ".env" ]; then
    # Remove sensitive data before backup
    grep -v -E "(PASSWORD|SECRET|KEY)" .env > "$BACKUP_DIR/${BACKUP_NAME}_config.env" || true
    echo "✅ Configuration backup created (sensitive data removed)"
fi

# Backup logs
echo "📝 Backing up logs..."
if [ -d "logs" ]; then
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}_logs.tar.gz" logs/
    echo "✅ Logs backup created: ${BACKUP_NAME}_logs.tar.gz"
fi

# Create complete backup archive
echo "📦 Creating complete backup archive..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_complete.tar.gz" \
    --exclude="node_modules" \
    --exclude="dist" \
    --exclude="build" \
    --exclude=".git" \
    --exclude="data/backups" \
    .

echo "✅ Complete backup created: ${BACKUP_NAME}_complete.tar.gz"

# Cleanup old backups (keep last 30 days)
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "dca_bot_backup_*" -type f -mtime +30 -delete
echo "✅ Old backups cleaned up"

# Display backup info
echo ""
echo "📋 Backup Summary:"
echo "  Location: $BACKUP_DIR"
echo "  Files created:"
ls -la "$BACKUP_DIR" | grep "$DATE"

echo ""
echo "✅ Backup process completed successfully!"