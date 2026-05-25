#!/usr/bin/env bash
# =============================================================================
# Instaluje crony: daily backup 02:00, weekly update 04:00 niedziela
# =============================================================================
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
   echo "Run as root: sudo bash cron-install.sh"
   exit 1
fi

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cat > /etc/cron.d/izbica24-n8n <<EOF
# izbica24 Newsroom — n8n maintenance
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Daily backup at 02:00
0 2 * * *  root  cd $REPO_DIR && bash scripts/backup.sh >> /var/log/izbica24-backup.log 2>&1

# Weekly update Sunday 04:00
0 4 * * 0  root  cd $REPO_DIR && bash scripts/update.sh >> /var/log/izbica24-update.log 2>&1

# Hourly: docker stats / disk check
17 * * * *  root  df -h | awk '\$5+0 > 85 {print}' | mail -E -s "izbica24 disk warning" admin@izbica24.pl 2>/dev/null || true
EOF
chmod 0644 /etc/cron.d/izbica24-n8n

systemctl restart cron
echo "[cron] zainstalowano. Sprawdź: cat /etc/cron.d/izbica24-n8n"
