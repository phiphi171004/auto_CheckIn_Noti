# Script push code lên GitHub
# Chạy: .\push-github.ps1

Write-Host "`n🚀 Piggi Auto Check-in - Push to GitHub`n" -ForegroundColor Cyan

# Kiểm tra xem đã có token chưa
$token = Read-Host "Nhập GitHub Personal Access Token (hoặc Enter để bỏ qua)"

if ($token) {
    Write-Host "Setting remote URL with token..." -ForegroundColor Yellow
    git remote set-url origin "https://$token@github.com/phiphi171004/auto_CheckIn_Noti.git"
} else {
    Write-Host "Using existing credentials..." -ForegroundColor Yellow
}

# Push code
Write-Host "`nPushing to GitHub..." -ForegroundColor Green
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Push successful!" -ForegroundColor Green
    Write-Host "`n📦 Repository: https://github.com/phiphi171004/auto_CheckIn_Noti" -ForegroundColor Cyan
    Write-Host "`n🚀 Next step: Deploy to Render.com (see RENDER_DEPLOY.md)`n" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Push failed!" -ForegroundColor Red
    Write-Host "See PUSH_TO_GITHUB.md for troubleshooting`n" -ForegroundColor Yellow
}

Read-Host "Press Enter to exit"
