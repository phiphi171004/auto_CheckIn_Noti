# 📤 Hướng dẫn Push code lên GitHub

## ⚠️ Vấn đề hiện tại

Git đang dùng account sai (`tangocphiphilhu-122000550`) thay vì `phiphi171004`.

## ✅ Giải pháp: Dùng Personal Access Token

### Bước 1: Tạo Personal Access Token trên GitHub

1. Đăng nhập GitHub bằng account `phiphi171004`
2. Truy cập: https://github.com/settings/tokens
3. Click **"Generate new token"** → **"Generate new token (classic)"**
4. Đặt tên: `Piggi Auto CheckIn`
5. Chọn scope: **✅ repo** (full control of private repositories)
6. Click **"Generate token"**
7. **Copy token** (chỉ hiện 1 lần!) - VD: `ghp_xxxxxxxxxxxxxxxxxxxx`

### Bước 2: Push code với Token

Mở PowerShell và chạy:

\`\`\`powershell
cd "c:\\Users\\tango\\Downloads\\auto check_in noti"

# Đổi remote URL (thay YOUR_TOKEN bằng token vừa copy)
git remote set-url origin https://YOUR_TOKEN@github.com/phiphi171004/auto_CheckIn_Noti.git

# Push code
git push -u origin main
\`\`\`

**Ví dụ** (thay token thật):
\`\`\`powershell
git remote set-url origin https://ghp_abc123xyz456@github.com/phiphi171004/auto_CheckIn_Noti.git
git push -u origin main
\`\`\`

---

## 🔐 Cách 2: Dùng GitHub CLI (gh)

Nếu đã cài `gh`:

\`\`\`powershell
gh auth login
# Chọn: GitHub.com → HTTPS → Yes → Login with a web browser

cd "c:\\Users\\tango\\Downloads\\auto check_in noti"
git push -u origin main
\`\`\`

---

## 🔐 Cách 3: Dùng Git Credential Manager

\`\`\`powershell
# Xóa credential cũ
git credential reject https://github.com

# Push lại (sẽ hiện popup đăng nhập GitHub)
cd "c:\\Users\\tango\\Downloads\\auto check_in noti"
git push -u origin main
\`\`\`

Popup sẽ hiện ra → Đăng nhập bằng account `phiphi171004`

---

## ✅ Kiểm tra thành công

Sau khi push xong, truy cập:

**https://github.com/phiphi171004/auto_CheckIn_Noti**

Bạn sẽ thấy toàn bộ code đã lên!

---

## 📋 Tổng kết các file đã commit

Code đã được commit với **59 files**:

### Backend:
- ✅ `backend/server-db.js` - Main server
- ✅ `backend/piggi-api.js` - API wrapper  
- ✅ `backend/db/db.js` - Database queries
- ✅ `backend/services/checkin-service.js` - Business logic
- ✅ `backend/.env.example` - Environment template
- ✅ `backend/package.json` - Dependencies

### Frontend:
- ✅ `frontend-react/src/` - React components (toàn bộ)
- ✅ `frontend-react/dist/` - Built files (để deploy)
- ✅ `frontend-react/package.json` - Dependencies

### Documentation:
- ✅ `README.md` - Hướng dẫn chính
- ✅ `DEPLOY.md` - Hướng dẫn deploy VPS
- ✅ `RENDER_DEPLOY.md` - Hướng dẫn deploy Render
- ✅ `deploy-checklist.md` - Checklist nhanh
- ✅ `PHAN_TICH.md` - API analysis

### Config:
- ✅ `.gitignore` - Bảo vệ file nhạy cảm
- ❌ `.env` - KHÔNG commit (được bảo vệ)

---

## 🚀 Sau khi push xong

1. Xác nhận code đã lên GitHub
2. Vào Render.com và deploy (xem `RENDER_DEPLOY.md`)
3. Nhớ thêm environment variable `DATABASE_URL` trên Render!

---

**Chúc bạn thành công! 🎉**
