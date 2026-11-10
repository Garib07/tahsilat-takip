@echo off
chcp 65001 >nul
title Tahsilat Takip - Temiz Kurulum
cd /d "%~dp0"

echo.
echo  Tahsilat Takip temiz kurulum hazirligi
echo  =====================================
echo.

echo  [1/4] Calisan surecler kapatiliyor...
taskkill /F /IM "Tahsilat Takip.exe" /T >nul 2>&1
taskkill /F /IM "electron.exe" /T >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process -Name 'Tahsilat Takip','electron' -ErrorAction SilentlyContinue | Stop-Process -Force; Get-NetTCPConnection -LocalPort 3847 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3847" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%a /T >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo  [2/4] Eski kurulum kaldiriliyor...
set "INSTALL_DIR=%LOCALAPPDATA%\Programs\Tahsilat Takip"
set "UNINSTALLER=%INSTALL_DIR%\Uninstall Tahsilat Takip.exe"

if exist "%UNINSTALLER%" (
  "%UNINSTALLER%" /S
  timeout /t 4 /nobreak >nul
)

echo  [3/4] Eski klasor temizleniyor...
taskkill /F /IM "Tahsilat Takip.exe" /T >nul 2>&1
if exist "%INSTALL_DIR%" (
  rmdir /s /q "%INSTALL_DIR%" >nul 2>&1
)

echo  [4/4] Kurulum dosyasi aciliyor...
if not exist "dist-electron\Tahsilat-Takip-Setup-2.0.0.exe" (
  echo.
  echo  HATA: dist-electron\Tahsilat-Takip-Setup-2.0.0.exe bulunamadi.
  echo  Once Tahsilat-Takip-Kurulum-Olustur.bat calistirin.
  echo.
  pause
  exit /b 1
)

start "" "dist-electron\Tahsilat-Takip-Setup-2.0.0.exe"
echo.
echo  Temizlik tamamlandi, kurulum penceresi acildi.
echo.
pause
