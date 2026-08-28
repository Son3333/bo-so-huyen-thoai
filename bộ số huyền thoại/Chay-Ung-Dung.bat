@echo off
chcp 65001 > nul
title BỘ SỐ HUYỀN THOẠI - Sổ Tay Chốt Số Toàn Diện AI
cd /d "%~dp0"

set "EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_PATH%" set "EDGE_PATH=C:\Program Files\Microsoft\Edge\Application\msedge.exe"

if exist "%EDGE_PATH%" (
    start "" "%EDGE_PATH%" --app="file:///%~dp0index.html" --window-size=1300,850
) else (
    start "" "%~dp0index.html"
)
exit
