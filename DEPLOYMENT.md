# 🚀 VPS & Docker Deployment Guide

This guide details how to deploy the **TradeNext OTC Fullstack Trading Platform** to any Linux VPS (Ubuntu/Debian, AWS EC2, DigitalOcean, Hetzner, Linode, etc.) using Docker or direct PM2 setup.

---

## 📋 System Requirements
- **OS**: Ubuntu 22.04 / 24.04 LTS (or Debian 12)
- **CPU / RAM**: Minimum 1 vCPU, 1 GB RAM (2 GB recommended)
- **Ports**: `80` (HTTP), `443` (HTTPS), `5000` (Node Backend)

---

## Option 1: Docker & Docker Compose Deployment (Recommended)

### Step 1: Install Docker & Docker Compose on your VPS
SSH into your VPS and install Docker:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin
```
*(Log out and back into your SSH session for docker group permissions to take effect).*

---

### Step 2: Clone the Repository & Configure Environment
```bash
git clone https://github.com/saikat1236/otc.git
cd otc
```

Create/edit your `.env` file:
```bash
cp .env.example .env
nano .env
```

Ensure your `.env` has your configuration:
```env
PORT=5000
NODE_ENV=production
# MongoDB Atlas Connection String (or leave default for local Docker Mongo)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mb0omwn.mongodb.net/otc_trade?retryWrites=true&w=majority
```

---

### Step 3: Build & Launch with Docker Compose
Run the following command in the project directory:
```bash
# Build the optimized multi-stage image and start in background
docker compose up -d --build
```

Verify that the container is healthy and running:
```bash
docker compose ps
docker compose logs -f app
```

Check health status:
```bash
curl http://localhost:5000/api/status
# Expected response: {"status":"ONLINE", ...}
```

---

## 🌐 Step 4: Configure Domain, Nginx & SSL (Let's Encrypt)

Because Socket.io uses persistent WebSockets, your reverse proxy must forward WebSocket upgrade headers.

### 1. Install Nginx and Certbot
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Copy the Provided Nginx Config
```bash
sudo cp nginx/otc.conf /etc/nginx/sites-available/otc.conf
sudo ln -s /etc/nginx/sites-available/otc.conf /etc/nginx/sites-enabled/
```

Edit `/etc/nginx/sites-available/otc.conf` and update `server_name` with your actual domain or VPS IP:
```bash
sudo nano /etc/nginx/sites-available/otc.conf
```
Change:
```nginx
server_name your-domain.com www.your-domain.com;
```

Test and reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Generate Free HTTPS Certificate with Certbot
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```
Certbot will automatically install SSL certificates and set up auto-renewal.

---

## 🛠️ Option 2: Direct VPS Deployment (Node.js + PM2)

If you prefer running without Docker:

### 1. Install Node.js 22 & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Build & Start with PM2
```bash
cd otc

# Install dependencies and build client
npm run build

# Start server under PM2 process manager
pm2 start server/server.js --name "otc-trading"
pm2 save
pm2 startup
```

---

## 🔄 Useful Operations & Maintenance

### Update to Latest Code on VPS
```bash
git pull origin main
docker compose up -d --build
```

### View Live Logs
```bash
docker compose logs -f app
```

### Restart Application
```bash
docker compose restart app
```

### Stop Application
```bash
docker compose down
```
