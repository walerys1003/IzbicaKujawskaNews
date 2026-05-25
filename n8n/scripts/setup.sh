#!/usr/bin/env bash
# =============================================================================
# izbica24 Newsroom — first-time VPS setup (Hetzner CX22 / Debian 12)
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[setup]${NC} $*"; }
warn() { echo -e "${YELLOW}[setup]${NC} $*"; }

if [[ $EUID -ne 0 ]]; then
   echo "Run as root: sudo bash setup.sh"
   exit 1
fi

log "1/8 — apt update + upgrade"
apt-get update -qq
apt-get upgrade -y -qq

log "2/8 — instaluję wymagane pakiety"
apt-get install -y -qq curl ca-certificates gnupg ufw fail2ban htop ncdu jq cron

log "3/8 — Docker + compose plugin"
if ! command -v docker >/dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

log "4/8 — firewall (UFW)"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
ufw status

log "5/8 — fail2ban (SSH brute-force)"
systemctl enable --now fail2ban

log "6/8 — swap 2 GB (CX22 ma 4 GB RAM)"
if ! swapon --show | grep -q swap; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

log "7/8 — kernel sysctl (network + memory)"
cat > /etc/sysctl.d/99-izbica24.conf <<'EOF'
net.core.somaxconn=4096
net.ipv4.tcp_max_syn_backlog=4096
net.ipv4.ip_local_port_range=1024 65000
vm.swappiness=10
vm.overcommit_memory=1
EOF
sysctl -p /etc/sysctl.d/99-izbica24.conf

log "8/8 — uruchamiam stack"
cd "$(dirname "$0")/.."
if [[ ! -f .env ]]; then
    warn ".env nie istnieje — kopiuję z .env.example, EDYTUJ I PODAJ SEKRETY!"
    cp .env.example .env
    warn "Po edycji .env wykonaj: docker compose up -d"
    exit 0
fi
docker compose pull
docker compose up -d
sleep 5
docker compose ps

log "Setup ukończony!"
log "→ Logi: docker compose logs -f n8n"
log "→ UI:    https://$(grep '^N8N_HOST=' .env | cut -d= -f2)"
log "→ Cron backup: zainstaluj przez: bash scripts/cron-install.sh"
