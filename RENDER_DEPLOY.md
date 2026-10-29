# 🚀 Deploy lên Render.com

## Bước 1: Push code lên GitHub

Code đã được push lên: https://github.com/phiphi171004/auto_CheckIn_Noti

## Bước 2: Tạo Web Service trên Render

1. Truy cập: https://render.com
2. Đăng nhập bằng GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect repository: **phiphi171004/auto_CheckIn_Noti**
5. Cấu hình:

### ⚙️ Settings:

| Field | Value |
|-------|-------|
| **Name** | `piggi-auto-checkin` |
| **Region** | Singapore (gần VN nhất) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server-db.js` |
| **Instance Type** | Free |

### 🔐 Environment Variables:

Click **"Add Environment Variable"** và thêm:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://postgres.wasnhvhwkbpstqvvzlvw:Rf1UyKwehqARad3F@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` |
| `PORT` | `3000` |
| `TZ` | `Asia/Ho_Chi_Minh` |

⚠️ **Lưu ý**: Thay `DATABASE_URL` bằng connection string Supabase của bạn nếu khác

## Bước 3: Deploy

1. Click **"Create Web Service"**
2. Render sẽ tự động:
   - Clone repo
   - Install dependencies
   - Start server
3. Đợi 2-3 phút để deploy xong

## Bước 4: Truy cập

Sau khi deploy thành công, Render sẽ cho bạn URL:

```
https://piggi-auto-checkin.onrender.com
```

Click vào URL để mở web dashboard!

---

## 🔧 Cấu hình thêm (Optional)

### Auto-deploy khi push code mới

Render tự động redeploy khi bạn push code lên GitHub main branch.

### Custom Domain

1. Settings → **Custom Domain**
2. Add domain: `piggi.yourdomain.com`
3. Update DNS CNAME record

### Logs

Click **"Logs"** để xem real-time logs của server

### Restart

Click **"Manual Deploy"** → **"Deploy latest commit"** để restart

---

## ⚠️ Lưu ý quan trọng

### 1. Free Tier Limitations

Render Free tier có một số giới hạn:
- ⏰ **Server tự động sleep sau 15 phút không hoạt động**
- 🔄 **Wake up mất ~30 giây** khi có request đầu tiên
- 💾 **750 giờ/tháng** (đủ chạy 24/7 cả tháng)

**Giải pháp cho cron:**

Vì server sleep → cron không chạy được! Cần setup **external cron** để ping server:

#### Option A: UptimeRobot (Khuyên dùng - FREE)

1. Đăng ký: https://uptimerobot.com (FREE)
2. Add Monitor:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://piggi-auto-checkin.onrender.com/api/accounts`
   - **Monitoring Interval**: 5 minutes
3. UptimeRobot sẽ ping server mỗi 5 phút → server không bao giờ sleep

#### Option B: Cron-job.org (FREE)

1. Đăng ký: https://cron-job.org
2. Create cronjob:
   - **URL**: `https://piggi-auto-checkin.onrender.com/api/accounts`
   - **Schedule**: Every 5 minutes
   - **Enable**: Yes

#### Option C: Upgrade Render ($7/month)

- Paid plan không bao giờ sleep
- Không cần external ping

### 2. Timezone

Đã set `TZ=Asia/Ho_Chi_Minh` trong environment variables → Cron sẽ chạy theo giờ VN

### 3. Database Connection

Supabase free tier có giới hạn connections:
- **Direct**: 60 connections
- **Pooler** (đang dùng): 200 connections

Nếu lỗi "too many connections", kiểm tra lại connection string dùng **Pooler mode** (port 6543)

---

## 🎯 Kiểm tra Deploy thành công

1. ✅ Truy cập URL Render → thấy trang web
2. ✅ Login tài khoản được
3. ✅ Check-in thủ công thành công
4. ✅ Xem Logs: thấy "✅ Connected to PostgreSQL database"
5. ✅ Setup UptimeRobot để giữ server không sleep
6. ✅ Đợi đến giờ cron và kiểm tra auto check-in

---

## 🐛 Troubleshooting

### Lỗi: "Application failed to respond"

→ Check logs, có thể:
- DATABASE_URL sai
- Port conflict
- Code lỗi

### Lỗi: "Cannot connect to database"

→ Kiểm tra:
1. DATABASE_URL đúng format
2. Supabase database đang chạy
3. IP của Render có được Supabase cho phép (Supabase cho phép mọi IP)

### Cron không chạy

→ Vấn đề server sleep! Setup UptimeRobot như hướng dẫn trên

### Build failed

→ Check:
1. `backend/package.json` có đúng dependencies
2. Root Directory = `backend`
3. Build Command = `npm install`

---

## 🔄 Update code sau này

Khi có thay đổi code:

```bash
# Trên máy local
git add .
git commit -m "Update feature"
git push origin main
```

→ Render tự động redeploy!

---

## 📊 So sánh Platforms

| Platform | Free Tier | Sleep? | Best For |
|----------|-----------|--------|----------|
| **Render** | 750h/month | ✅ Yes (15min) | Quick start |
| **Railway** | $5 credit | ❌ No | Production |
| **Fly.io** | 3 VMs | ❌ No | Global CDN |
| **Heroku** | Eco $5/month | ✅ Yes (30min) | Legacy apps |
| **VPS** | $5-10/month | ❌ No | Full control |

**Khuyên dùng**: Render + UptimeRobot (FREE hoàn toàn) hoặc Railway ($5/month cho production)

---

**Chúc bạn deploy thành công! 🎉**
