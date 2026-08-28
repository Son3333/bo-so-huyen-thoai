@echo off
chcp 65001 > nul
title Tạo Biểu Tượng Desktop - Bộ Số Huyền Thoại
echo ================================================================
echo   ⚡ ĐANG TẠO BIỂU TƯỢNG (SHORTCUT) RA MÀN HÌNH CHÍNH DESKTOP...
echo ================================================================

powershell -NoProfile -Command "$wsh = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath('Desktop'); $shortcutPath = Join-Path $desktop 'Bo-So-Huyen-Thoai.lnk'; $cloudUrl = 'https://bo-so-huyen-thoai.onrender.com/'; $scriptDir = '%~dp0'; $icoPath = Join-Path $scriptDir 'app.ico'; if (-not (Test-Path $icoPath)) { $icoPath = Join-Path $env:LOCALAPPDATA 'BoSoHuyenThoai\app.ico' }; $edgePath = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'; if (-not (Test-Path $edgePath)) { $edgePath = 'C:\Program Files\Microsoft\Edge\Application\msedge.exe' }; $shortcut = $wsh.CreateShortcut($shortcutPath); $shortcut.TargetPath = $edgePath; $shortcut.Arguments = \"--app=`\"$cloudUrl`\" --window-size=1300,850\"; if (Test-Path $icoPath) { $shortcut.IconLocation = \"$icoPath,0\" }; $shortcut.Description = 'Bộ Số Huyền Thoại - Sổ Tay Chốt Số Toàn Diện AI'; $shortcut.Save()"

echo.
echo [THÀNH CÔNG] Đã tạo biểu tượng "Bo-So-Huyen-Thoai" với icon Vàng Kim ra Desktop!
echo Từ giờ bạn chỉ cần ra màn hình chính nhấp đúp vào biểu tượng là mở app ngay!
echo.
pause
