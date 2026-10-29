# ✅ Deploy Checklist - Piggi Auto Check-in

## Trước khi deploy

- [ ] Build frontend: `cd frontend-react && npm run build`
- [ ] Test local: `cd backend && node server-db.js`
- [ ] Kiểm tra `.env` có đủ thông tin
- [ ] Backup database (nếu cần)

## File cần upload lên server

```
📦 Cần upload:
├── backend/
│   ├── server-db.js          ✅
│   ├── piggi-api.js          ✅
│   ├── package.json          ✅
│   ├── package-lock.json     ✅
│   ├── .env                  ⚠️ Tạo trực tiếp trên server (bảo mật!)
│   ├── db/
│   │   └── db.js             ✅
│   └── services/
│       └── checkin-service.js ✅
│
└── frontend-react/
    └── dist/                 ✅ (toàn bộ thư mục)
        ├── index.html
        └── assets/

❌ KHÔNG upload:
- node_modules/
- .kiro/
- .taste-skill/
- *.csv
- *.log
```

## Lệnh trên VPS

### 1. Cài dependencies
```bash
cd backend
npm install --production
```

### 2. Tạo file .env
```bash
nano .env
```
Paste:
```
DATABASE_URL=postgresql://postgres.xxx:xxx@xxx.supabase.com:6543/postgres?sslmode=require
PORT=3000
```

### 3. Test chạy
```bash
node server-db.js
```

### 4. Chạy với PM2 (24/7)
```bash
# Cài PM2 (chỉ lần đầu)
sudo npm install -g pm2

# Start server
pm2 start server-db.js --name piggi-checkin

# Xem logs
pm2 logs piggi-checkin

# Save để auto-start khi reboot
pm2 startup
pm2 save
```

## Kiểm tra sau deploy

- [ ] Truy cập http://server-ip:3000 thấy trang web
- [ ] Login được tài khoản
- [ ] Check-in thủ công OK
- [ ] Xem lịch sử hiển thị đúng email
- [ ] Xem logs PM2: `pm2 logs`
- [ ] Check cron schedule: kiểm tra xem giờ có đúng múi giờ VN không

## Update code sau này

```bash
# 1. Upload file mới lên server (scp/git pull)

# 2. Nếu có thay đổi frontend
cd frontend-react
npm run build

# 3. Nếu có thay đổi dependencies
cd backend
npm install

# 4. Restart PM2
pm2 restart piggi-checkin

# 5. Xem logs để chắc chắn
pm2 logs piggi-checkin --lines 50
```

## Troubleshooting

### Không kết nối được database
```bash
# Test connection
cd backend
node -e "import('./db/db.js')"
```

### Port 3000 bị chiếm
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Cron không chạy
```bash
pm2 logs piggi-checkin | grep "Scheduled check-in"
```

## 🔒 Bảo mật

- ⚠️ **QUAN TRỌNG**: File `.env` chứa DATABASE_URL → KHÔNG commit lên Git public!
- Set permissions: `chmod 600 backend/.env`
- Nếu dùng Git: đảm bảo `.env` nằm trong `.gitignore`

## 📊 Monitor

```bash
# Real-time monitoring
pm2 monit

# Xem tất cả processes
pm2 status

# Xem 100 dòng log cuối
pm2 logs piggi-checkin --lines 100
```
