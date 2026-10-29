# 🐷 Piggi Auto Check-in System

Hệ thống tự động điểm danh và quản lý nhiều tài khoản Piggi.

---

## ✨ Tính năng

- ✅ **Tự động điểm danh** hàng ngày (theo lịch tùy chỉnh)
- 👥 **Quản lý nhiều tài khoản** trong 1 hệ thống
- 📊 **Theo dõi xu** (hiện tại, chờ, tích lũy)
- 🔥 **Chuỗi điểm danh** liên tục
- 🎯 **Điểm danh thủ công** bất cứ lúc nào
- 📜 **Lịch sử** persistent trong database
- 🗄️ **PostgreSQL** (Supabase) - data không bị mất
- 🌐 **Web dashboard** quản lý dễ dàng
- 🔒 **Code obfuscation** cho production

---

## 🚀 Quick Start

### Bước 1: Chuẩn bị Database

1. Lấy **DATABASE_URL** từ Supabase:
   - Truy cập: https://supabase.com/dashboard
   - Settings → Database → Connection String (**Transaction** mode)
   - Copy password

2. Update `backend/.env`:
```env
DATABASE_URL=postgresql://postgres.wasnhvhwkbpstqvvzlvw:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

3. Run migration:
```bash
migrate-database.bat
```

Hoặc manual:
```bash
cd backend
npm run migrate
```

### Bước 2: Start Server

```bash
cd backend
npm start
```

### Bước 3: Mở Web UI

```
http://localhost:3000
```

---

## 👥 Thêm Tài Khoản

### Trên Web UI:

1. Click **"➕ Thêm tài khoản"**
2. Điền thông tin:
   - **Số điện thoại**: 0987654321
   - **Mật khẩu**: your_password
   - **Device ID**: ✨ Tự động tạo sẵn! Click "🔄 Tạo mới" nếu muốn đổi
   - **Thời gian**: Chọn giờ (00-23) và phút (00, 15, 30, 45)
3. Click **"✅ Thêm tài khoản"**

**Chỉ cần nhập Phone + Password!** Device ID và schedule đều có UI dễ dùng.

### Via API:

```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "0987654321",
    "password": "your_password",
    "deviceId": "random16chars",
    "cronSchedule": "0 7 * * *"
  }'
```

---

## 📊 Database Schema

### Table: accounts
```sql
id, phone_number, password, device_id,
jwt_token, firebase_token,
cron_schedule, is_active,
user_name, current_coin, pending_coin,
accumulated_coin, current_checkin, rank_name,
created_at, updated_at, last_login_at, last_checkin_at
```

### Table: checkin_history
```sql
id, account_id, success, error_message,
coin_before, coin_after, checkin_streak,
created_at, is_scheduled
```

### Table: api_logs
```sql
id, account_id, endpoint, method,
status_code, response_time, error, created_at
```

---

## 🎛️ API Endpoints

### Accounts
```
GET    /api/accounts              # Danh sách tài khoản
POST   /api/accounts              # Thêm tài khoản
PATCH  /api/accounts/:id/schedule # Đổi lịch điểm danh
PATCH  /api/accounts/:id/toggle   # Bật/Tắt tài khoản
DELETE /api/accounts/:id          # Xóa tài khoản
```

### Check-in
```
POST   /api/checkin               # Điểm danh tất cả
POST   /api/checkin/:id           # Điểm danh account cụ thể
GET    /api/user/:id              # Lấy thông tin user
```

### History
```
GET    /api/history               # Lịch sử tất cả
GET    /api/history/:id           # Lịch sử của account
```

---

## ⏰ Lịch Điểm Danh

### Trên Web UI:
- Chọn **Giờ**: 00-23
- Chọn **Phút**: 00, 15, 30, 45
- Hệ thống tự động convert sang cron

### Ví dụ:
- 06:00 → `0 6 * * *`
- 08:30 → `30 8 * * *`
- 18:45 → `45 18 * * *`

### Đổi lịch (không cần restart):
- Click vào "⏰ [time] ✏️" trong danh sách
- Chọn giờ + phút mới
- Click ✓ để lưu

---

## 🔧 Quản Lý Tài Khoản

### Bật/Tắt:
- Click "⏸️ Tắt" để tạm dừng auto check-in
- Click "▶️ Bật" để khôi phục

### Xóa:
- Click "🗑️ Xóa"
- Tài khoản và lịch sử sẽ bị xóa khỏi database

### Xem thông tin:
Mỗi tài khoản hiển thị:
- 💰 Xu hiện tại
- 🔥 Chuỗi điểm danh
- 📅 Lần điểm danh cuối
- 👤 Tên, SĐT, Hạng

---

## 📁 Cấu Trúc Project

```
auto check_in noti/
├── backend/
│   ├── db/
│   │   ├── db.js              # Database queries
│   │   ├── schema.sql         # PostgreSQL schema
│   │   └── migrate.js         # Migration script
│   ├── services/
│   │   └── checkin-service.js # Business logic
│   ├── server-db.js           # Main server
│   ├── piggi-api.js           # Piggi API wrapper
│   └── .env                   # Config
│
├── frontend-react/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AccountManager.jsx  # Quản lý accounts
│   │   │   ├── Dashboard.jsx       # Dashboard
│   │   │   └── ...
│   │   └── App.jsx
│   └── dist/                  # Production build (obfuscated)
│
├── migrate-database.bat       # Migration script
├── build-production.bat       # Build React
├── start-production.bat       # Start server
└── README.md                  # This file
```

---

## 🛠️ Development

### Backend:
```bash
cd backend

# Test database connection
npm run test:db

# Run migration
npm run migrate

# Start server
npm start

# Dev mode (auto-reload)
npm run dev
```

### Frontend:
```bash
cd frontend-react

# Dev mode (hot reload)
npm run dev  # → http://localhost:5173

# Build production
npm run build
```

### Full Stack (Production):
```bash
# Build frontend
cd frontend-react
npm run build

# Start backend (serve frontend + API)
cd ../backend
npm start  # → http://localhost:3000
```

---

## 📊 SQL Queries Hữu Ích

### Xem tất cả accounts:
```sql
SELECT id, phone_number, cron_schedule, is_active, 
       current_coin, current_checkin, last_checkin_at
FROM accounts
ORDER BY id;
```

### Lịch sử check-in hôm nay:
```sql
SELECT a.phone_number, ch.success, ch.coin_after, ch.checkin_streak
FROM checkin_history ch
JOIN accounts a ON ch.account_id = a.id
WHERE DATE(ch.created_at) = CURRENT_DATE
ORDER BY ch.created_at DESC;
```

### Thống kê success rate:
```sql
SELECT a.phone_number,
       COUNT(*) as total,
       SUM(CASE WHEN ch.success THEN 1 ELSE 0 END) as successful,
       ROUND(100.0 * SUM(CASE WHEN ch.success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM checkin_history ch
JOIN accounts a ON ch.account_id = a.id
GROUP BY a.id, a.phone_number
ORDER BY success_rate DESC;
```

---

## 🔒 Security

### Environment Variables:
```env
DATABASE_URL=postgresql://...    # Supabase connection
PORT=3000                        # Server port
```

### Best Practices:
- ✅ `.env` trong `.gitignore`
- ✅ Database password an toàn
- ✅ Production code obfuscated
- ✅ API chỉ localhost (hoặc thêm auth nếu public)

---

## 🚢 Deploy Production

### VPS (Ubuntu):
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone/Upload code
cd /var/www/piggi-checkin

# Build frontend
cd frontend-react
npm install && npm run build

# Start backend với PM2
cd ../backend
npm install
pm2 start server-db.js --name piggi-checkin
pm2 save
pm2 startup
```

### Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app

# Build frontend
COPY frontend-react ./frontend-react
RUN cd frontend-react && npm install && npm run build

# Backend
COPY backend ./backend
RUN cd backend && npm install

WORKDIR /app/backend
CMD ["node", "server-db.js"]
```

### Cloud Platforms:
- **Railway**: Auto deploy từ GitHub
- **Heroku**: Free tier
- **Render**: Free tier với DB
- **Vercel**: Frontend (serverless backend)

---

## 🔧 Troubleshooting

### Lỗi: "DATABASE_URL not found"
→ Chưa config `.env`, xem bước 1

### Lỗi: "password authentication failed"
→ Password Supabase sai, check lại

### Lỗi: "relation does not exist"
→ Chưa chạy migration: `migrate-database.bat`

### Lỗi: "Port 3000 already in use"
→ Đổi `PORT=3001` trong `.env`

### Check-in failed
→ Xem logs trong bảng `api_logs`:
```sql
SELECT * FROM api_logs 
WHERE error IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📝 Scripts

```bash
# Database
npm run test:db     # Test connection
npm run migrate     # Run migration

# Server
npm start           # Production
npm run dev         # Development (auto-reload)
npm run start:legacy # Old server (no database)

# Testing
npm run test        # Test API
```

---

## ✅ Features Checklist

- [x] Multi-account support
- [x] PostgreSQL database
- [x] Auto-generate Device ID
- [x] User-friendly schedule picker
- [x] Web dashboard (React)
- [x] Account management UI
- [x] Check-in history
- [x] API logging
- [x] Code obfuscation (production)
- [x] Dynamic cron scheduling
- [x] Responsive design
- [x] Full documentation

---

## 🎉 Summary

### Dành cho Users:
- ✅ **Thêm tài khoản siêu dễ**: Chỉ cần Phone + Password
- ✅ **Chọn giờ trực quan**: Dropdown, không cần biết Cron
- ✅ **Quản lý nhiều TK**: Mỗi account lịch riêng
- ✅ **Web UI đẹp**: Dễ dùng, responsive

### Dành cho Developers:
- ✅ **Clean architecture**: Database → Service → API
- ✅ **Scalable**: PostgreSQL, REST API
- ✅ **Production ready**: Obfuscated code, logging
- ✅ **Easy deploy**: Docker, PM2, Cloud platforms

---

## 📞 Support

Nếu gặp vấn đề:
1. Check logs: `pm2 logs piggi-checkin`
2. Check database: Xem tables `api_logs`, `checkin_history`
3. Test API: `curl http://localhost:3000/api/accounts`

---

**Happy Auto Check-in! 🚀**

Version: 2.0 (Database + Multi-Account)
