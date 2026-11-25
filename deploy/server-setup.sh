#!/usr/bin/env bash
# ================================================
#  CRM — One-shot Ubuntu server setup (Oracle Free VM)
#  Usage: sudo bash server-setup.sh
# ================================================
set -e

echo "==> [1/6] Updating system..."
apt update -y
apt -y upgrade

echo "==> [2/6] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v

echo "==> [3/6] Installing tools (zip, unzip, pm2)..."
apt-get install -y zip unzip
npm install -g pm2

# ---- Small VMs (1 GB RAM) need swap to survive `next build` ----
RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
if [ "$RAM_KB" -lt 2000000 ]; then
  echo "==> [3b] RAM < 2GB — adding 3GB swap to survive build..."
  if ! swapon --show | grep -q swapfile; then
    fallocate -l 3G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
fi

if [ ! -f /opt/crm/package.json ]; then
  echo "==> [4/6] Waiting for app files..."
  echo "   Upload crm-deploy.zip first, then run this script." 
  echo "   (See ORACLE-GUIDE.md step 5)"
  exit 1
fi

echo "==> [5/6] Installing app dependencies & building..."
cd /opt/crm
npm install
npm run build

echo "==> [6/6] Starting CRM with pm2 (auto-restart on boot)..."
pm2 start "npm run start" --name crm
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
pm2 save

# ---- Open port 3000 on OS firewall ----
iptables -I INPUT -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true
# persist iptables across reboots
apt-get install -y iptables-persistent >/dev/null 2>&1 || true
netfilter-persistent save >/dev/null 2>&1 || true

echo ""
echo "======================================"
echo "  ✅ CRM is running!"
echo "  Check it:  curl http://localhost:3000"
echo "  Remaining steps (Windows):"
echo "   1. Open port 3000 in Oracle Cloud Security List"
echo "   2. Set NEXTAUTH_URL on the server to http://YOUR-IP:3000"
echo "      nano /opt/crm/.env  ->  then:  pm2 restart crm"
echo "   3. Restore database: upload data/crm.db to /opt/crm/data/"
echo "======================================"
