@echo off
chcp 65001 >nul
title BỘ SỐ HUYỀN THOẠI - MASTER CLOUD SERVER & BOT TỰ ĐỘNG
color 0A

echo ====================================================================
echo   👑 BỘ SỐ HUYỀN THOẠI - KHỞI ĐỘNG MÁY CHỦ TRUNG TÂM & BOT 18H32
echo ====================================================================
echo.
echo [1/2] Đang kiểm tra môi trường chạy Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Cảnh báo: Máy bạn chưa cài Python. 
    echo     App vẫn chạy hoàn hảo ở chế độ Độc lập (Standalone Native Mode).
    echo     Nếu muốn chạy Bot Telegram tự động, hãy cài Python 3.10+.
    pause
    exit /b
)

echo [2/2] Đang kích hoạt Master Server Hub & Auto-Crawler...
start "Master Server API (Port 8080)" python api_server.py
timeout /t 2 >nul
start "Auto Crawler & Broadcast 18h32" python auto_crawler.py --daemon

echo.
echo ====================================================================
echo   ✅ MÁY CHỦ TRUNG TÂM ĐÃ KHỞI ĐỘNG THÀNH CÔNG!
echo   • API Server: http://localhost:8080/api/canonical-slip
echo   • Lịch cào: Tự động cào kết quả và bắn số lúc 18h15 - 18h32
echo ====================================================================
echo.
pause

