@echo off
chcp 65001 > nul
title Tạo Biểu Tượng Desktop - Bộ Số Huyền Thoại
echo ================================================================
echo   ⚡ ĐANG TẠO BIỂU TƯỢNG (SHORTCUT) RA MÀN HÌNH CHÍNH DESKTOP...
echo ================================================================

powershell -NoProfile -Command "$fso = New-Object -ComObject Scripting.FileSystemObject; $folder = $fso.GetFolder('%~dp0'); $shortPath = $folder.ShortPath; $exePath = Join-Path $shortPath 'Bo-So-Huyen-Thoai.exe'; $icoPath = Join-Path $shortPath 'app.ico'; $WshShell = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath('Desktop'); $shortcut = $WshShell.CreateShortcut(\"$desktop\Bo So Huyen Thoai.lnk\"); $shortcut.TargetPath = $exePath; $shortcut.WorkingDirectory = $shortPath; $shortcut.IconLocation = \"$icoPath,0\"; $shortcut.Description = 'Bộ Số Huyền Thoại - Hệ Thống Dự Đoán Lô Đề AI'; $shortcut.Save()"

echo.
echo [THÀNH CÔNG] Đã tạo biểu tượng "Bo So Huyen Thoai" với icon mới ra Desktop!
echo Từ giờ bạn chỉ cần ra màn hình chính nhấp đúp vào biểu tượng là mở app ngay!
echo.
pause
