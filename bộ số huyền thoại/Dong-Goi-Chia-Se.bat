@echo off
chcp 65001 > nul
title Đóng Gói Ứng Dụng Chia Sẻ - Bộ Số Huyền Thoại
echo ================================================================
echo   ⚡ ĐANG NÉN TOÀN BỘ ỨNG DỤNG THÀNH TỆP ZIP ĐỂ GỬI CHO NGƯỜI KHÁC...
echo ================================================================

powershell -Command "Compress-Archive -Path '%~dp0*' -DestinationPath '%~dp0..\Bo-So-Huyen-Thoai-App.zip' -Force"

echo.
echo ================================================================
echo [THÀNH CÔNG] Đã tạo tệp "Bo-So-Huyen-Thoai-App.zip" trong thư mục Downloads!
echo.
echo 📦 HƯỚNG DẪN GỬI CHO NGƯỜI KHÁC:
echo 1. Gửi tệp "Bo-So-Huyen-Thoai-App.zip" qua Zalo, Telegram, Facebook hoặc USB.
echo 2. Người nhận chỉ cần Giải Nén (Extract) ra thư mục bất kỳ.
echo 3. Nhấp đúp vào "Bo-So-Huyen-Thoai.exe" là mở app dùng được ngay lập tức!
echo    (Hoặc bấm "Tao-Bieu-Tuong-Desktop.bat" để tạo icon ra màn hình Desktop).
echo ================================================================
echo.
pause

