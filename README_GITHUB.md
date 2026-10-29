# 🐷 Piggi Auto Check-in System

Hệ thống tự động check-in điểm danh Piggi với web dashboard quản lý nhiều tài khoản.

![Version](https://img.shields.io/badge/version-2.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## ✨ Tính năng

- ✅ **Đăng nhập đa phương thức**: Phone + Password hoặc Google OAuth
- ✅ **Quản lý nhiều tài khoản**: Dashboard web để thêm/sửa/xóa tài khoản
- ✅ **Auto check-in 24/7**: Cron jobs tự động chạy hằng ngày theo lịch
- ✅ **Lịch sử chi tiết**: Theo dõi mọi lượt check-in, coin, streak
- ✅ **Múi giờ Việt Nam**: Tất cả timestamps theo giờ VN (UTC+7)
- ✅ **Database PostgreSQL**: Lưu trữ an toàn trên Supabase

---

## 🚀 Quick Start

### 1. Clone repository
\`\`\`bash
git clone https://github.com/phiphi171004/auto_CheckIn_Noti.git
cd auto_CheckIn_Noti
\`\`\`

### 2. Cài dependencies
\`\`\`bash
cd backend
npm install
\`\`\`

### 3. Cấu hình database
Tạo file \`backend/.env\`:
\`\`\`env
DATABASE_URL=postgresql://postgres.[project]:[password]@[region].pooler.supabase.com:6543/postgres?sslmode=require
PORT=3000
\`\`\`

### 4. Chạy server
\`\`\`bash
node server-db.js
\`\`\`

Mở trình duyệt: **http://localhost:3000**

---

## 📦 Deploy

### Deploy lên Render.com (FREE)

Xem hướng dẫn chi tiết: **[RENDER_DEPLOY.md](./RENDER_DEPLOY.md)**

**Tóm tắt:**
1. Fork/Clone repo này
2. Tạo Web Service trên Render.com
3. Connect repo GitHub
4. Set environment variable \`DATABASE_URL\`
5. Deploy!

⚠️ **Lưu ý**: Render free tier sẽ sleep sau 15 phút không hoạt động. Dùng [UptimeRobot](https://uptimerobot.com) để ping server mỗi 5 phút (xem hướng dẫn trong RENDER_DEPLOY.md).

### Deploy lên VPS

Xem hướng dẫn chi tiết: **[DEPLOY.md](./DEPLOY.md)**

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: React + Vite
- **Database**: PostgreSQL (Supabase)
- **Scheduler**: node-cron
- **Process Manager**: PM2 (production)

---

## 📂 Cấu trúc project

\`\`\`
.
├── backend/
│   ├── server-db.js          # Express server + cron scheduler
│   ├── piggi-api.js          # Piggi API wrapper
│   ├── db/
│   │   ├── db.js             # PostgreSQL queries
│   │   └── schema.sql        # Database schema
│   └── services/
│       └── checkin-service.js # Business logic
│
├── frontend-react/
│   ├── src/                  # React source
│   └── dist/                 # Built files (after npm run build)
│
├── DEPLOY.md                 # VPS deployment guide
├── RENDER_DEPLOY.md          # Render.com deployment guide
└── README.md                 # This file
\`\`\`

---

## 🕐 Cron Schedule Format

Cron dùng format 5 trường: \`minute hour * * *\`

**Ví dụ:**
- \`0 6 * * *\` → 6:00 AM mỗi ngày
- \`30 10 * * *\` → 10:30 AM mỗi ngày
- \`0 18 * * *\` → 6:00 PM mỗi ngày

---

## 🔧 Scripts hữu ích

\`\`\`bash
# Test database connection
cd backend
node test-connection.js

# Backup database
node backup-db.js

# Check timestamps
node db/check-timestamp.js
\`\`\`

---

## 📊 Database Schema

### \`accounts\`
\`\`\`sql
id, phone_number, password, device_id, jwt_token, 
email, user_name, current_coin, pending_coin,
accumulated_coin, current_checkin, rank_name,
cron_schedule, is_active, created_at, updated_at
\`\`\`

### \`checkin_history\`
\`\`\`sql
id, account_id, success, error_message,
coin_before, coin_after, checkin_streak,
is_scheduled, created_at
\`\`\`

### \`api_logs\`
\`\`\`sql
id, account_id, endpoint, method,
status_code, response_time, error, created_at
\`\`\`

---

## 🐛 Troubleshooting

### Không kết nối được database
\`\`\`bash
node test-connection.js
\`\`\`

### Timestamps sai múi giờ
\`\`\`bash
# Kiểm tra timezone server
timedatectl

# Đổi sang VN timezone
sudo timedatectl set-timezone Asia/Ho_Chi_Minh
\`\`\`

### Cron không chạy (Render Free Tier)
→ Server bị sleep! Setup UptimeRobot để ping mỗi 5 phút (xem RENDER_DEPLOY.md)

---

## ⚠️ Lưu ý bảo mật

- 🔒 File \`.env\` chứa \`DATABASE_URL\` → KHÔNG commit lên Git public
- 🔒 Đã được bảo vệ bởi \`.gitignore\`
- 🔒 Dùng \`.env.example\` làm template

---

## 📝 TODO

- [ ] Point Missions auto-complete
- [ ] Auto claim vouchers
- [ ] Auto spin lucky wheel
- [ ] Telegram notifications
- [ ] Email alerts on failure

---

## 📜 License

MIT © phiphi171004

---

## 🤝 Contributing

PRs welcome! Issues và suggestions cũng được hoan nghênh.

---

## 📞 Support

Nếu gặp vấn đề khi deploy hoặc sử dụng:
1. Đọc [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) hoặc [DEPLOY.md](./DEPLOY.md)
2. Check logs: \`pm2 logs piggi-checkin\`
3. Open an issue trên GitHub

---

**Made with ❤️ by phiphi171004**

⭐ Star repo này nếu thấy hữu ích!
