@echo off
chcp 65001 > nul
title BỘ SỐ HUYỀN THOẠI - Hệ Thống Dự Đoán & Soi Cầu AI
cd /d "%~dp0"

if exist "%~dp0Bo-So-Huyen-Thoai.exe" (
    start "" "%~dp0Bo-So-Huyen-Thoai.exe"
) else (
    start "" "%~dp0index.html"
)
exit
