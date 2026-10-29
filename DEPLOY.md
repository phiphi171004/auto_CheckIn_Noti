# Hướng dẫn Deploy lên VPS

## 📦 File cần đẩy lên server

### **Cách 1: Upload toàn bộ project (đơn giản nhất)**

Upload cả folder `auto check_in noti` lên server, **TRỪ** các thư mục này:
```
❌ KHÔNG upload:
- node_modules/          (cài lại trên server bằng npm install)
- frontend-react/node_modules/
- .kiro/                 (chỉ dùng local)
- .taste-skill/          (chỉ dùng local)
```

### **Cách 2: Chỉ upload file cần thiết (tối ưu)**

```
✅ Upload những file này:
backend/
  ├── server-db.js       (server chính)
  ├── piggi-api.js       (API Piggi)
  ├── package.json       (dependencies)
  ├── package-lock.json  (lock versions)
  ├── .env               (⚠️ chứa DATABASE_URL - bảo mật!)
  ├── db/
  │   └── db.js          (database queries)
  └── services/
      └── checkin-service.js

frontend-react/
  └── dist/              (frontend đã build - thư mục này được tạo khi chạy npm run build)
      ├── index.html
      └── assets/
```

---

## 🚀 Các bước deploy

### **Bước 1: Chuẩn bị VPS**

SSH vào VPS của bạn:
```bash
ssh user@your-server-ip
```

Cài đặt Node.js (nếu chưa có):
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra
node -v
npm -v
```

### **Bước 2: Upload code lên server**

**Option A: Dùng Git (khuyên dùng)**
```bash
# Trên máy local
cd "c:\Users\tango\Downloads\auto check_in noti"
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main

# Trên VPS
git clone <your-repo-url>
cd auto-check-in-noti
```

**Option B: Dùng SCP/SFTP**
```bash
# Trên máy Windows (PowerShell)
scp -r "c:\Users\tango\Downloads\auto check_in noti" user@server-ip:/home/user/
```

**Option C: Dùng FileZilla hoặc WinSCP**
- Kéo thả folder lên server qua giao diện GUI

### **Bước 3: Cài dependencies trên server**

```bash
cd /path/to/auto-check-in-noti/backend
npm install
```

### **Bước 4: Cấu hình .env**

Đảm bảo file `backend/.env` có đúng thông tin:
```env
DATABASE_URL=postgresql://postgres.[project]:[password]@[region].pooler.supabase.com:6543/postgres?sslmode=require
PORT=3000
```

⚠️ **BẢO MẬT**: KHÔNG commit file `.env` lên Git public! Nên tạo file này trực tiếp trên server.

### **Bước 5: Test chạy thử**

```bash
cd backend
node server-db.js
```

Nếu thấy:
```
🚀 Piggi Auto Check-in Server Started (Database Mode)!
📡 Server running on: http://localhost:3000
✅ Connected to PostgreSQL database
```

→ Thành công! Nhấn `Ctrl+C` để thoát.

### **Bước 6: Cài PM2 để chạy 24/7**

PM2 giúp server chạy background và tự restart khi crash:

```bash
# Cài PM2 global
sudo npm install -g pm2

# Chạy server với PM2
cd /path/to/auto-check-in-noti/backend
pm2 start server-db.js --name "piggi-checkin"

# Xem logs
pm2 logs piggi-checkin

# Xem status
pm2 status

# Lưu lại để tự động chạy khi server reboot
pm2 startup
pm2 save
```

### **Bước 7: Mở port firewall (nếu cần)**

```bash
# Ubuntu UFW
sudo ufw allow 3000/tcp
sudo ufw status

# CentOS/RHEL firewalld
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

### **Bước 8: Setup Nginx reverse proxy (khuyên dùng)**

Thay vì expose port 3000, dùng Nginx làm proxy:

```bash
# Cài Nginx
sudo apt install nginx

# Tạo config
sudo nano /etc/nginx/sites-available/piggi-checkin
```

Paste config này:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Hoặc IP của bạn

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable và restart:
```bash
sudo ln -s /etc/nginx/sites-available/piggi-checkin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Giờ truy cập: `http://your-server-ip` hoặc `http://your-domain.com`

---

## 🔄 PM2 Commands Cheat Sheet

```bash
pm2 start server-db.js --name piggi-checkin  # Khởi động
pm2 stop piggi-checkin                       # Dừng
pm2 restart piggi-checkin                    # Restart
pm2 logs piggi-checkin                       # Xem logs real-time
pm2 logs piggi-checkin --lines 100           # Xem 100 dòng log cuối
pm2 status                                   # Xem tất cả processes
pm2 delete piggi-checkin                     # Xóa process
pm2 monit                                    # Monitor CPU/Memory
```

---

## ⚠️ Lưu ý quan trọng

### 1. **Bảo mật file .env**
- KHÔNG commit `.env` lên Git public
- Set permissions: `chmod 600 backend/.env`

### 2. **Timezone trên server**
Kiểm tra timezone VPS:
```bash
timedatectl
```

Nếu sai, đổi sang Asia/Ho_Chi_Minh:
```bash
sudo timedatectl set-timezone Asia/Ho_Chi_Minh
```

### 3. **Database connection**
- Supabase có giới hạn connection pool
- Nếu gặp lỗi "too many connections", giảm số connection trong code

### 4. **Cron jobs**
- Cron chỉ chạy khi server đang chạy
- PM2 tự động restart nếu crash
- Kiểm tra logs thường xuyên: `pm2 logs`

### 5. **Update code sau này**

Khi có thay đổi code:
```bash
# Pull code mới (nếu dùng Git)
git pull

# Cài lại dependencies (nếu có thay đổi package.json)
cd backend
npm install

# Build lại frontend (nếu có thay đổi UI)
cd ../frontend-react
npm run build

# Restart PM2
pm2 restart piggi-checkin
```

---

## 🎯 Kiểm tra deployment thành công

1. ✅ Truy cập `http://your-server-ip:3000` thấy giao diện web
2. ✅ Login được tài khoản
3. ✅ Check-in thủ công thành công
4. ✅ Xem lịch sử hiển thị đúng
5. ✅ Đợi đến giờ cron và kiểm tra tự động check-in
6. ✅ Check PM2 logs: `pm2 logs piggi-checkin`

---

## 🆘 Troubleshooting

### Lỗi "Cannot connect to database"
```bash
# Kiểm tra DATABASE_URL trong .env
cat backend/.env

# Test connection từ server
cd backend
node -e "import('./db/db.js').then(() => console.log('Connected!'))"
```

### Lỗi "Port 3000 already in use"
```bash
# Tìm process đang dùng port 3000
sudo lsof -i :3000

# Kill process đó
sudo kill -9 <PID>
```

### Cron không chạy tự động
```bash
# Xem logs PM2
pm2 logs piggi-checkin

# Kiểm tra timezone server
timedatectl

# Kiểm tra lịch trong database
psql $DATABASE_URL -c "SELECT id, phone_number, cron_schedule FROM accounts WHERE is_active = true;"
```

---

## 📊 Monitoring

### Setup thông báo qua Telegram (optional)

Tạo bot Telegram để nhận thông báo khi check-in:
1. Tìm @BotFather trên Telegram
2. Tạo bot mới và lấy token
3. Thêm vào `.env`: `TELEGRAM_BOT_TOKEN=your-token`
4. Code thêm notification trong `checkin-service.js`

---

Nếu có câu hỏi gì thêm về deploy, cứ hỏi tôi nhé! 🚀
