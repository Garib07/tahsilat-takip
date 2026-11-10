@echo off
chcp 65001 >nul
title Tahsilat Takip - Kurulum Oncesi Temizlik
cd /d "%~dp0"

echo.
echo  Kurulumdan once arka planda kalan surecler kapatiliyor...
echo.

taskkill /F /IM "Tahsilat Takip.exe" /T >nul 2>&1
taskkill /F /IM "electron.exe" /T >nul 2>&1

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3847" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%a /T >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo  Temizlik tamamlandi.
echo  Simdi kurulum dosyasini calistirabilirsiniz:
echo  dist-electron\Tahsilat-Takip-Setup-2.0.0.exe
echo.
pause
